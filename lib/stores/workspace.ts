import { create } from "zustand";

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  members?: WorkspaceMember[];
}

interface WorkspaceStore {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;

  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  error: null,

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addWorkspace: (workspace) => {
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    }));
  },

  updateWorkspace: (workspace) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspace.id ? workspace : w
      ),
    }));
  },

  removeWorkspace: (workspaceId) => {
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
    }));
  },
}));
