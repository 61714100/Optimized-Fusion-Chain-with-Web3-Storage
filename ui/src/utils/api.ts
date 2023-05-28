import axios from "axios";
import { ITransaction } from "./types";

export const getDataFromCID = (cid: string, fileName: string) => {
  return axios.get(`https://${cid}.ipfs.w3s.link/${fileName}`);
};

export const getDevicesApi = () => {
  return axios.get("/device/transaction/list");
};

export const createTransactionApi = (transaction: ITransaction) => {
  return axios.post("/device/transaction/new", {
    data: {
      ...transaction,
    },
  });
};

export const getPeersInfo = () => {
  return axios.get("/peers/info");
};

export const getUnverifiedTransaction = () => {
  return axios.get("/device/unverified/transaction");
};

export const getBlocks = () => {
  return axios.get("/device/blocks");
};

export const getCpuUsage = () => {
  return axios.get('/cpu');
}