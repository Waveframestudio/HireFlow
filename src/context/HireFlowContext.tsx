import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Application,
  Candidate,
  Interview,
  InterviewStatus,
  Job,
  PipelineStage,
} from '../types';
import {
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
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [jobsRes, candRes, appRes, intRes] = await Promise.all([
          client.from('jobs').select('*').order('created_at', { ascending: false }),
          client.from('candidates').select('*').order('created_at', { ascending: false }),
          client.from('applications').select('*').order('ats_score', { ascending: false }),
          client.from('interviews').select('*').order('scheduled_at', { ascending: true }),
        ]);

        if (jobsRes.data) setJobs(jobsRes.data as Job[]);
        if (candRes.data) setCandidates(candRes.data as Candidate[]);
        if (appRes.data) setApplications(appRes.data as Application[]);
        if (intRes.data) setInterviews(intRes.data as Interview[]);
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
  };

  const addInterview = async (interviewInput: Omit<Interview, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('interviews')
        .insert(interviewInput)
        .select()
        .single();
      if (!error && data) setInterviews((prev) => [...prev, data as Interview]);
      return;
    }

    setInterviews((prev) => [
      ...prev,
      {
        ...interviewInput,
        id: `int-${Date.now()}`,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const updateInterview = async (
    id: string,
    updates: Partial<Pick<Interview, 'status' | 'feedback' | 'rating'>>
  ) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('interviews').update(updates).eq('id', id);
    }
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  return (
    <HireFlowContext.Provider
      value={{
        jobs,
        candidates,
        applications,
        interviews,
        loading,
        isSupabaseMode: isSupabaseConfigured,
        addJob,
        updateJobStatus,
        addCandidate,
        applyCandidateToJob,
        moveApplicationStage,
        addInterview,
        updateInterview,
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
