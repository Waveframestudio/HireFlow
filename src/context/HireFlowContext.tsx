import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActivityLog,
  Application,
  Candidate,
  Interview,
  InterviewStatus,
  Job,
  PipelineStage,
  STAGE_LABELS,
} from '../types';
import {
  initialActivityLogs,
  initialApplications,
  initialCandidates,
  initialInterviews,
  initialJobs,
} from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { calculateATSScore } from '../lib/ats';

interface HireFlowContextValue {
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  interviews: Interview[];
  activityLogs: ActivityLog[];
  loading: boolean;
  isSupabaseMode: boolean;
  addJob: (job: Omit<Job, 'id' | 'created_at'>) => Promise<void>;
  updateJobStatus: (jobId: string, status: Job['status']) => Promise<void>;
  addCandidate: (
    candidate: Omit<Candidate, 'id' | 'created_at'>,
    applyToJobId?: string,
    cvFile?: File | null
  ) => Promise<void>;
  applyCandidateToJob: (candidateId: string, jobId: string) => Promise<void>;
  moveApplicationStage: (
    applicationId: string,
    stage: PipelineStage,
    rejectionReason?: string
  ) => Promise<void>;
  addInterview: (interview: Omit<Interview, 'id' | 'created_at'>) => Promise<void>;
  updateInterview: (
    id: string,
    updates: Partial<Pick<Interview, 'status' | 'feedback' | 'rating'>>
  ) => Promise<void>;
  logActivity: (entry: Omit<ActivityLog, 'id' | 'created_at'>) => void;
}

const HireFlowContext = createContext<HireFlowContextValue | null>(null);

export const HireFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>(isSupabaseConfigured ? [] : initialJobs);
  const [candidates, setCandidates] = useState<Candidate[]>(
    isSupabaseConfigured ? [] : initialCandidates
  );
  const [applications, setApplications] = useState<Application[]>(
    isSupabaseConfigured ? [] : initialApplications
  );
  const [interviews, setInterviews] = useState<Interview[]>(
    isSupabaseConfigured ? [] : initialInterviews
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(
    isSupabaseConfigured ? [] : initialActivityLogs
  );
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  const logActivity = (entry: Omit<ActivityLog, 'id' | 'created_at'>) => {
    const newLog: ActivityLog = {
      ...entry,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('activity_logs').insert(newLog).then(() => {});
    }
  };

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [jobsRes, candRes, appRes, intRes, actRes] = await Promise.all([
          client.from('jobs').select('*').order('created_at', { ascending: false }),
          client.from('candidates').select('*').order('created_at', { ascending: false }),
          client.from('applications').select('*').order('ats_score', { ascending: false }),
          client.from('interviews').select('*').order('scheduled_at', { ascending: true }),
          client.from('activity_logs').select('*').order('created_at', { ascending: false }),
        ]);

        if (jobsRes.data) setJobs(jobsRes.data as Job[]);
        if (candRes.data) setCandidates(candRes.data as Candidate[]);
        if (appRes.data) setApplications(appRes.data as Application[]);
        if (intRes.data) setInterviews(intRes.data as Interview[]);
        if (actRes.data) setActivityLogs(actRes.data as ActivityLog[]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const addJob = async (jobInput: Omit<Job, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('jobs').insert(jobInput).select().single();
      if (!error && data) setJobs((prev) => [data as Job, ...prev]);
      return;
    }

    const newJob: Job = {
      ...jobInput,
      id: `job-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);
  };

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('jobs').update({ status }).eq('id', jobId);
    }
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  };

  const addCandidate = async (
    candidateInput: Omit<Candidate, 'id' | 'created_at'>,
    applyToJobId?: string,
    cvFile?: File | null
  ) => {
    let cv_url = candidateInput.cv_url;
    let cv_filename = candidateInput.cv_filename || cvFile?.name;

    if (isSupabaseConfigured && supabase) {
      if (cvFile) {
        const path = `${Date.now()}_${cvFile.name.replace(/\s+/g, '_')}`;
        const upload = await supabase.storage.from('resumes').upload(path, cvFile);
        if (!upload.error) {
          cv_url = upload.data.path;
        }
      }

      const { data, error } = await supabase
        .from('candidates')
        .insert({ ...candidateInput, cv_url, cv_filename })
        .select()
        .single();

      if (!error && data) {
        const created = data as Candidate;
        setCandidates((prev) => [created, ...prev]);
        if (applyToJobId) {
          await applyCandidateToJobInternal(created, applyToJobId);
        }
      }
      return;
    }

    const newCandidate: Candidate = {
      ...candidateInput,
      cv_url,
      cv_filename,
      id: `cand-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCandidates((prev) => [newCandidate, ...prev]);

    logActivity({
      user_name: 'Sofía Seal',
      user_role: 'Recruiter RRHH',
      action_type: 'candidate_created',
      title: `Registró a ${candidateInput.full_name} en la base de talento`,
      details: `Años de experiencia: ${candidateInput.years_experience} • Fuente: ${candidateInput.source}`,
      candidate_id: newCandidate.id,
      candidate_name: newCandidate.full_name,
    });

    if (applyToJobId) {
      await applyCandidateToJobInternal(newCandidate, applyToJobId);
    }
  };

  const applyCandidateToJobInternal = async (candidate: Candidate, jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const alreadyApplied = applications.some(
      (a) => a.candidate_id === candidate.id && a.job_id === jobId
    );
    if (alreadyApplied) return;

    const ats = calculateATSScore(candidate, job);
    const payload = {
      job_id: jobId,
      candidate_id: candidate.id,
      stage: 'applied' as PipelineStage,
      ats_score: ats.score,
      matched_skills: ats.matchedSkills,
      missing_skills: ats.missingSkills,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('applications').insert(payload).select().single();
      if (!error && data) setApplications((prev) => [data as Application, ...prev]);
      return;
    }

    const now = new Date().toISOString();
    setApplications((prev) => [
      {
        ...payload,
        id: `app-${Date.now()}`,
        applied_at: now,
        updated_at: now,
      },
      ...prev,
    ]);
  };

  const applyCandidateToJob = async (candidateId: string, jobId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;
    await applyCandidateToJobInternal(candidate, jobId);
  };

  const moveApplicationStage = async (
    applicationId: string,
    stage: PipelineStage,
    rejectionReason?: string
  ) => {
    const updatedAt = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('applications')
        .update({
          stage,
          rejection_reason: stage === 'rejected' ? rejectionReason || null : null,
          updated_at: updatedAt,
        })
        .eq('id', applicationId);
    }
    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              stage,
              rejection_reason: stage === 'rejected' ? rejectionReason : undefined,
              updated_at: updatedAt,
            }
          : a
      )
    );

    // Registro de actividad
    const targetApp = applications.find((a) => a.id === applicationId);
    const cand = targetApp ? candidates.find((c) => c.id === targetApp.candidate_id) : null;
    const job = targetApp ? jobs.find((j) => j.id === targetApp.job_id) : null;

    logActivity({
      user_name: 'Sofía Seal',
      user_role: 'Recruiter RRHH',
      action_type: stage === 'rejected' ? 'candidate_rejected' : 'stage_changed',
      title:
        stage === 'rejected'
          ? `Descartó a ${cand?.full_name || 'Candidato'}`
          : `Movió a ${cand?.full_name || 'Candidato'} a etapa ${STAGE_LABELS[stage]}`,
      details: rejectionReason
        ? `Motivo: ${rejectionReason}`
        : `Vacante: ${job?.title || 'General'}`,
      candidate_id: cand?.id,
      candidate_name: cand?.full_name,
      job_title: job?.title,
    });
  };

  const addInterview = async (interviewInput: Omit<Interview, 'id' | 'created_at'>) => {
    let createdInt: Interview | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('interviews')
        .insert(interviewInput)
        .select()
        .single();
      if (!error && data) {
        createdInt = data as Interview;
        setInterviews((prev) => [...prev, createdInt!]);
      }
    } else {
      createdInt = {
        ...interviewInput,
        id: `int-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setInterviews((prev) => [...prev, createdInt!]);
    }

    const app = applications.find((a) => a.id === interviewInput.application_id);
    const cand = app ? candidates.find((c) => c.id === app.candidate_id) : null;
    const job = app ? jobs.find((j) => j.id === app.job_id) : null;

    logActivity({
      user_name: interviewInput.interviewer || 'Sofía Seal',
      user_role: 'Entrevistador',
      action_type: 'interview_scheduled',
      title: `Agendó citación con ${cand?.full_name || 'Candidato'}`,
      details: `${interviewInput.type.toUpperCase()} • ${new Date(
        interviewInput.scheduled_at
      ).toLocaleDateString('es-AR')}`,
      candidate_id: cand?.id,
      candidate_name: cand?.full_name,
      job_title: job?.title,
    });
  };

  const updateInterview = async (
    id: string,
    updates: Partial<Pick<Interview, 'status' | 'feedback' | 'rating'>>
  ) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('interviews').update(updates).eq('id', id);
    }
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));

    if (updates.status === 'completed') {
      const int = interviews.find((i) => i.id === id);
      const app = int ? applications.find((a) => a.id === int.application_id) : null;
      const cand = app ? candidates.find((c) => c.id === app.candidate_id) : null;
      const job = app ? jobs.find((j) => j.id === app.job_id) : null;

      logActivity({
        user_name: int?.interviewer || 'Lucas Gómez',
        user_role: 'Hiring Manager',
        action_type: 'interview_completed',
        title: `Calificó la entrevista de ${cand?.full_name || 'Candidato'}${
          updates.rating ? ` con ${updates.rating}★` : ''
        }`,
        details: updates.feedback || 'Sin notas adicionales',
        candidate_id: cand?.id,
        candidate_name: cand?.full_name,
        job_title: job?.title,
      });
    }
  };

  return (
    <HireFlowContext.Provider
      value={{
        jobs,
        candidates,
        applications,
        interviews,
        activityLogs,
        loading,
        isSupabaseMode: isSupabaseConfigured,
        addJob,
        updateJobStatus,
        addCandidate,
        applyCandidateToJob,
        moveApplicationStage,
        addInterview,
        updateInterview,
        logActivity,
      }}
    >
      {children}
    </HireFlowContext.Provider>
  );
};

export const useHireFlow = () => {
  const ctx = useContext(HireFlowContext);
  if (!ctx) throw new Error('useHireFlow debe usarse dentro de HireFlowProvider');
  return ctx;
};
