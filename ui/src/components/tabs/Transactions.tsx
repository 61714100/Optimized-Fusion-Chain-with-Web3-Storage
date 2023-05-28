import { useEffect, useRef, useState } from "react";
import { INodeData } from "../../utils/types";
import { MESSAGE_TYPE } from "../../utils/constants";
import dayjs from "dayjs";
import { Scroller } from "../shared/Scroller";
import { getUnverifiedTransaction } from "../../utils/api";
import { Loader } from "semantic-ui-react";

export const Transactions = () => {
  const [loader, setLoader] = useState(true);
  const [nodeData, setNodeData] = useState<INodeData>();

  useEffect(() => {
    getUnverifiedTransaction()
      .then((response) => {
        const transactions: any[] = [];
        response?.data?.forEach((transaction: any, index: number) => {
          transactions.push({
            transactionIndex: index + 1,
            timestamp: isNaN(Number(transaction?.input?.timestamp))
              ? transaction?.input?.timestamp
              : dayjs(transaction?.input?.timestamp).format(
                  "DD/MMM/YYYY HH:mm:ss"
                ),
            hash: transaction?.hash,
            signature: transaction?.signature,
            data: transaction?.input.data,
            from: transaction?.from,
            fileName: transaction.fileName,
          });
        });
        setNodeData({ transactions: transactions });
      })
      .finally(() => {
        setTimeout(() => {
          setLoader(false);
        }, 1000);
      });
  }, []);

  if (loader) {
    return <Loader active />;
  }

  return (
    <Scroller>
      <>
        <p className="text-gray-400 italic">
          Transaction's Are Validated By Peers And It Will Be Added To
          Blockchain Once Transaction Pool Reaches The Maximum Limit.
        </p>
        {nodeData?.transactions?.map((transaction: any, index) => {
          return (
            <div key={index} className="mt-4 pb-4 border-b-2">
              <div className="mt-2">
                <p className="font-bold">
                  Transaction# {transaction?.transactionIndex}
                </p>
              </div>
              <div className="ml-4">
                <div className="mt-2">
                  <p className="font-bold">Data</p>
                  <p className="break-words mt-1 ml-4">
                    <a
                      href={`https://${transaction.data}.ipfs.w3s.link/${transaction.fileName}`}
                      target="_blank"
                    >
                      {transaction?.data}
                    </a>
                  </p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Hash</p>
                  <p className="break-words mt-1 ml-4">{transaction?.hash}</p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Signature</p>
                  <p className="break-words mt-1 ml-4">
                    {transaction?.signature}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Created by</p>
                  <p className="break-words mt-1 ml-4">{transaction?.from}</p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Created At</p>
                  <p className="break-words mt-1 ml-4">
                    {transaction?.timestamp}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </>
    </Scroller>
  );
};
