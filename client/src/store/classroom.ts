import type { Classroom } from "@odyssey/shared";
import { create } from "zustand";

interface ClassroomStoreState {
  classrooms: Classroom[];
  selectedClassroomId: string | null;
  setClassrooms: (classrooms: Classroom[]) => void;
  selectClassroom: (classroomId: string) => void;
  clear: () => void;
}

/**
 * Zustand store for classroom selection state.
 */
export const useClassroomStore = create<ClassroomStoreState>((set) => ({
  classrooms: [],
  selectedClassroomId: null,
  setClassrooms: (classrooms) =>
    set((state) => {
      const selectedStillVisible = state.selectedClassroomId
        ? classrooms.some((room) => room.id === state.selectedClassroomId)
        : false;
      return {
        classrooms,
        selectedClassroomId: selectedStillVisible
          ? state.selectedClassroomId
          : classrooms[0]?.id ?? null
      };
    }),
  selectClassroom: (selectedClassroomId) => set({ selectedClassroomId }),
  clear: () => set({ classrooms: [], selectedClassroomId: null })
}));
