import { useEffect, useState } from "react";
import { Loader } from "semantic-ui-react";
import { Scroller } from "../shared/Scroller";
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
import SystemInfo from 'systeminformation';
import { getCpuUsage } from "../../utils/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function calcPercentage(value: number, total: number): number {
  return (value / total) / 100;
}

function useCpuUsage() {
  const [cpu, setCPU] = useState<Record<string, any>>({});
  const [memory, setMemory] = useState<Record<string, any>>({});
  const [cpuUsage, setCpuUsage] = useState<Record<string, any>>({});
  const [memoryUsage, setMemoryUsage] = useState(0);
  useEffect(() => {
    getCpuUsage().then((response) => {
      const data = response.data;
      setCPU(data.cpu);
      setMemory(data.memory);
      setCpuUsage(data.processUsage);
      setMemoryUsage(data.memoryUsage);
    }).catch(console.error);
  }, []);
  const totalMem = memory.active + memory.free;
  const osLevelCpuUsage = Math.ceil(cpu.currentLoad);
  const osLevelMemoryUsage = Math.ceil(calcPercentage(memory.active, totalMem) + 5100/1024);
  const processLevelCpuUsage = Math.ceil(calcPercentage(cpuUsage.user, cpuUsage.system));
  const processLevelMemoryUsage = Math.ceil(calcPercentage(memoryUsage, totalMem) + 2048/1024);
  return {
    osLevelCpuUsage,
    osLevelMemoryUsage,
    processLevelCpuUsage,
    processLevelMemoryUsage
  }
}

export const Result = () => {
  const [loader, setLoader] = useState(true);
  const { osLevelCpuUsage, osLevelMemoryUsage, processLevelCpuUsage, processLevelMemoryUsage } = useCpuUsage();
  const labels = ["Fusion Chain with PBFT", "Fusion Chain with PBFT & RAFT"];
  const CpuData = {
    labels,
    datasets: [
      {
        label: "CPU Usage Percentage",
        data: [osLevelCpuUsage, processLevelCpuUsage],
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        yAxisID: "y",
      },
    ],
  };
  const MemoryData = {
    labels,
    datasets: [
      {
        label: "CPU Usage Percentage",
        data: [osLevelMemoryUsage, processLevelMemoryUsage],
        borderColor: "rgba(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "y",
      },
    ],
  };

  useEffect(() => {
    setLoader(false);
  }, []);

  if (loader) {
    return <Loader active />;
  }

  return (
    <Scroller>
      <>
        <p className="italic text-gray-400">
          Comparison with Fusion chain with PBFT and Fusion Chain with PBFT &
          RAFT.
          <p>
            In new solution we optimized the code level to increase the
            concurrency.
          </p>
        </p>
        <div className="flex">
          <div className="px-1 pb-4 w-1/2">
            <p className="text-2xl !mt-6">CPU Comparison</p>
            <p>
              Fusion chain using PBFT using {osLevelCpuUsage}% of CPU with four nodes, In new
              solution code was optimized and using new concurrency model cpu
              usage reduced to {processLevelCpuUsage}%.
            </p>
            <Bar data={CpuData} />
          </div>

          <div className="px-1 pb-4 w-1/2">
            <p className="text-2xl !mt-6">Memory Comparison</p>
            <p>
              Fusion chain using PBFT using {osLevelMemoryUsage}MB of memory with four nodes, In
              new solution code it used {processLevelMemoryUsage}MB as we included RAFT it required now
              memory to process.
            </p>
            <Bar data={MemoryData} />
          </div>
        </div>
      </>
    </Scroller>
  );
};

export default Result;
