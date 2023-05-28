import { useEffect, useRef, useState } from "react";
import { INodeData } from "../../utils/types";
import { MESSAGE_TYPE } from "../../utils/constants";
import dayjs from "dayjs";
import { Scroller } from "../shared/Scroller";
import { getBlocks } from "../../utils/api";
import { Loader } from "semantic-ui-react";

export const Blocks = () => {
  const [loader, setLoader] = useState(true);
  const [nodeData, setNodeData] = useState<INodeData>();

  useEffect(() => {
    getBlocks()
      .then((response) => {
        const transactions: any[] = [];
        response?.data?.reverse().forEach((block: any, index: number) => {
          if (block?.data?.length === 0) {
            transactions.push({
              blockIndex: response?.data?.length - index,
              timestamp: isNaN(Number(block.timestamp))
                ? block.timestamp
                : dayjs(block.timestamp).format("DD/MMM/YYYY HH:mm:ss"),
              hash: block?.hash,
              prevHash: block?.lastHash,
              signature: block?.signature,
              tranasctionIndex: "",
              fileName: "",
              data: "",
              from: "",
            });
          } else {
            block?.data?.reverse()?.forEach((d: any, tindex: number) => {
              const transaction = {
                blockIndex: response?.data?.length - index,
                timestamp: isNaN(Number(block.timestamp))
                  ? block.timestamp
                  : dayjs(block.timestamp).format("MMMM DD YYYY HH:mm:ss"),
                hash: block?.hash,
                prevHash: block?.lastHash,
                signature: block?.signature,
                tranasctionIndex: tindex + 1,
                fileName: d?.fileName,
                data: d?.input?.data,
                from: d?.from,
              };

              transactions.push(transaction);
            });
          }
        });
        setNodeData({ transactions: transactions } as INodeData);
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
          Block's Are From Blockchain, Each Block Contain 'N' Number Of
          Transactions Which Transaction Pool Set.
        </p>
        {nodeData?.transactions?.map((block: any, index) => {
          return (
            <div key={index} className="mt-4 pb-4 border-b-2">
              <div className="mt-2">
                <p className="font-bold">Block# {block.blockIndex}</p>
              </div>
              <p className="mt-2 font-bold ml-4">
                Transaction# {block.tranasctionIndex}
              </p>
              <div className="ml-8">
                <div className="mt-2">
                  <p className="font-bold">Data</p>
                  <p className="break-words mt-1 ml-4">
                    <a
                      href={`https://${block.data}.ipfs.w3s.link/${block.fileName}`}
                      target="_blank"
                    >
                      {block.data}
                    </a>
                  </p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Hash</p>
                  <p className="break-words mt-1 ml-4">{block.hash}</p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Previous Hash</p>
                  <p className="break-words mt-1 ml-4">{block.prevHash}</p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Signature</p>
                  <p className="break-words mt-1 ml-4">{block.signature}</p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Created by</p>
                  <p className="break-words mt-1 ml-4">{block.from}</p>
                </div>
                <div className="mt-2">
                  <p className="font-bold">Created At</p>
                  <p className="break-words mt-1 ml-4">{block.timestamp}</p>
                </div>
              </div>
            </div>
          );
        })}
      </>
    </Scroller>
  );
};
