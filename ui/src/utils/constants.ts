import { IDeviceOption } from "./types";

export const MESSAGE_TYPE = {
  request_node_data: "REQUEST_NODE_DATA",
};

export const DEVICES_LIST: IDeviceOption[] = [
  {
    name: "Air Conditioner",
    watt: 2000,
  },
  {
    name: "Fan/Motor",
    watt: 75,
  },
  {
    name: "Lighting",
    watt: 20,
  },
  {
    name: "Refrigerator",
    watt: 300,
  },
  {
    name: "Television",
    watt: 200,
  },
  {
    name: "Washing Machine",
    watt: 1000,
  },
];

export const DEVICE_TURNED_DATE_FORMAT = "MMM DD YYYY hh:mm:ss A";
export const METRIC_DATE_FORMAT = "DD/MM/YY HH:mm";
