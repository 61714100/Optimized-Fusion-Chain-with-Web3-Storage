export interface INodeData {
  transactions: any[];
}

export interface IRealTimeSocket {
  node: number;
  connection: string;
}

export interface IDeviceOption {
  name: string;
  watt: number;
}

export interface IModalForm {
  type: string;
  name: string;
  watt: number;
}

export interface ITransaction {
  id: string;
  switch: boolean;
  type: string;
  name: string;
  lastTurnedOn: string;
  lastTurnedOff: string;
  watt: number;
  usage: number;
}

export interface IMetrics {
  id: string;
  name: string;
  type: string;
  data: ITransaction[];
}
