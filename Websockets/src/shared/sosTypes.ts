export interface SosMessage<TData = unknown> {
  event: string;
  data: TData;
}

export interface SosPlayerRef {
  id: string;
  name: string;
}

export interface SosTeamTarget extends SosPlayerRef {
  team_num: number;
}
