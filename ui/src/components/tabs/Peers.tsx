import { useEffect, useState } from "react";
import { Accordion, Card, Icon, Loader } from "semantic-ui-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import randomColor from "randomcolor";

import { Scroller } from "../shared/Scroller";
import { getPeersInfo } from "../../utils/api";
import dayjs from "dayjs";
import { METRIC_DATE_FORMAT } from "../../utils/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PEERS_COLORS: { [key: string]: { cpu: string; memory: string } } = {};

export const Peers = () => {
  const [loader, setLoader] = useState(true);
  const [info, setInfo] = useState([]);

  useEffect(() => {
    fetchPeersInfo(true);

    const timer = setInterval(fetchPeersInfo, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const fetchPeersInfo = (status?: boolean) => {
    getPeersInfo()
      .then((response) => {
        setInfo(response.data);
      })
      .finally(() => {
        if (status) {
          setTimeout(() => {
            setLoader(false);
          }, 1000);
        }
      });
  };

  if (loader) {
    return <Loader active />;
  }

  return (
    <Scroller>
      <>
        <p className="italic text-gray-400">
          All Active Peer's Information Listed Below Including CPU And Memory
          Utilization.
        </p>

        <div className="px-1 pb-4">
          {info.map((peer: any) => {
            if (!(peer.pid in PEERS_COLORS)) {
              PEERS_COLORS[peer.pid] = {
                cpu: randomColor(),
                memory: randomColor(),
              };
            }
            const cpuUsage =
              peer?.peerStats?.length > 0 &&
              peer?.peerStats[0]?.cpu?.toFixed(2);
            const memoryUsage =
              peer?.peerStats?.length > 0 &&
              (peer?.peerStats[0]?.memory * 0.000001)?.toFixed(2);

            let avgCpuUsage = 0;
            let avgMemoryUsage = 0;

            const cpuUsageData: {
              labels: string[];
              datasets: any[];
            } = {
              labels: [],
              datasets: [
                {
                  label: "CPU Usage",
                  data: [],
                  backgroundColor: PEERS_COLORS[peer.pid].cpu,
                },
              ],
            };
            const memoryUsageData: {
              labels: string[];
              datasets: any[];
            } = {
              labels: [],
              datasets: [
                {
                  label: "RAM Usage",
                  data: [],
                  backgroundColor: PEERS_COLORS[peer.pid].memory,
                },
              ],
            };

            peer?.peerStats?.forEach((stats: any) => {
              avgCpuUsage += stats.cpu;
              avgMemoryUsage += stats.memory * 0.000001;

              cpuUsageData.labels.push(dayjs(stats?.timestamp).format("HH:mm"));
              cpuUsageData.datasets[0].data.push(stats?.cpu);

              memoryUsageData.labels.push(
                dayjs(stats?.timestamp).format("HH:mm")
              );
              memoryUsageData.datasets[0].data.push(stats?.memory);
            });

            avgCpuUsage = Number(
              (avgCpuUsage / peer?.peerStats.length).toFixed(2)
            );
            avgMemoryUsage = Number(
              (avgMemoryUsage / peer?.peerStats.length).toFixed(2)
            );

            return (
              <Accordion
                key={peer?.peerStats?.pid}
                fluid
                styled
                className="mt-4"
              >
                <Accordion.Title active>
                  <Icon name="circle" className={"text-green-400"} />
                  <span className="font-bold ml-1">{peer?.peerName}</span>
                </Accordion.Title>
                <Accordion.Content active>
                  <div className="flex">
                    <div className="w-52">
                      <p className="text-xl text-gray-400 font-bold">
                        Average CPU Usage
                      </p>
                      <p className="text-5xl font-bold mt-1">{avgCpuUsage}%</p>
                    </div>
                    <div className="mx-8">
                      <p className="text-xl text-gray-400 font-bold">
                        Average RAM Usage
                      </p>
                      <p className="text-5xl font-bold mt-1">
                        {avgMemoryUsage}MB
                      </p>
                    </div>
                  </div>
                  <div className="flex mt-6">
                    <div className="w-52">
                      <p className="text-xl text-gray-400 font-bold">
                        Current CPU Usage
                      </p>
                      <p className="text-5xl font-bold mt-1">{cpuUsage}%</p>
                    </div>
                    <div className="ml-8">
                      <Bar data={cpuUsageData} />
                    </div>
                  </div>
                  <div className="flex mt-6">
                    <div className="w-52">
                      <p className="text-xl text-gray-400 font-bold">
                        Current RAM Usage
                      </p>
                      <p className="text-5xl font-bold mt-1">{memoryUsage}MB</p>
                    </div>
                    <div className="ml-8">
                      <Bar data={memoryUsageData} />
                    </div>
                  </div>
                  {/* <p>Usage Last Updated At {peer?.peerStats?.timestamp}</p> */}
                </Accordion.Content>
              </Accordion>
            );
          })}
        </div>
      </>
    </Scroller>
  );
};
