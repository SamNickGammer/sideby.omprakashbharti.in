export type Child = {
  id: string;
  name: string;
  age: number;
  color: "mint" | "peach" | "lavender" | "sky";
  avatar_key: string | null;
  archived: boolean;
};
export type Routine = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  days: "weekdays" | "weekends" | "daily";
  enabled: boolean;
};
export type FamilyData = {
  user: { id: string; name: string; email: string };
  family: { id: string; name: string; revision: number } | null;
  children: Child[];
  routines: Routine[];
};
export type Revision = { id: string; revision: number };
