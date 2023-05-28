import { useEffect, useState } from "react";
import { Grid, Loader, Segment } from "semantic-ui-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import randomColor from "randomcolor";

import { Scroller } from "../shared/Scroller";
import { getDataFromCID, getDevicesApi } from "../../utils/api";
import { IMetrics, ITransaction } from "../../utils/types";
import { METRIC_DATE_FORMAT } from "../../utils/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const createCIDDataPromise = (data: any) => {
  data?.forEach((data: any) => {
    data?.transactions?.forEach((transaction: any) => {
      getDataFromCID(transaction?.data, transaction?.fileName);
    });
  });
};

export const Metrics = () => {
  const [loader, setLoader] = useState(true);
  const [metrics, setMetrics] = useState<IMetrics[][]>([]);

  useEffect(() => {
    getDevicesApi()
      .then(async (response) => {
        createCIDDataPromise(response?.data);

        const resolvedMetrics: IMetrics[] = await Promise.all(
          response?.data?.map(
            async (data: any, index: number): Promise<any> => {
              const metricObject: any = {};

              metricObject.data = await Promise.all(
                data?.transactions?.map(
                  async (transaction: any): Promise<any> => {
                    const cidResponse = await getDataFromCID(
                      transaction?.data,
                      transaction?.fileName
                    );
                    return cidResponse.data;
                  }
                )
              );
              metricObject.id = metricObject.data[0]?.id;
              metricObject.name = metricObject.data[0]?.name;
              metricObject.type = metricObject.data[0]?.type;

              return metricObject;
            }
          )
        );

        const metricList: IMetrics[][] = [];

        resolvedMetrics.forEach((metric, index) => {
          if (index % 2 === 0) {
            metricList.push([]);
          }
          metricList[metricList.length - 1].push(metric);
        });

        setMetrics(metricList);
        setLoader(false);
      })
      .finally(() => {
        setTimeout(() => {
          setLoader(false);
        }, 20000);
      });
  }, []);

  if (loader) {
    return <Loader active />;
  }

  return (
    <Scroller>
      <>
        <p className="italic text-gray-400 mb-4">
          Device Metrics Are Listed Here, Based On Watt Usage And Time.
        </p>

        <Grid columns={2} stretched stackable>
          {metrics.map((metric, i) => {
            return (
              <Grid.Row key={i}>
                {metric.map((each, j) => {
                  const color = randomColor();
                  const data = {
                    labels: [] as string[],
                    datasets: [
                      {
                        label: `${each.name} Usage`,
                        data: each.data?.map((d) => d.usage),
                        borderColor: `${color}75`,
                        backgroundColor: `${color}50`,
                      },
                    ],
                  };
                  each.data?.forEach((d) => {
                    data.labels.push(
                      d.lastTurnedOff
                        ? dayjs(d.lastTurnedOff).format(METRIC_DATE_FORMAT)
                        : dayjs(d.lastTurnedOn).format(METRIC_DATE_FORMAT)
                    );
                  });

                  return (
                    <Grid.Column key={[each.id, j].join("-")}>
                      <Segment>
                        <div>
                          <p className="font-bold">{each.name}</p>
                          <p className="text-gray-400 text-sm">{each.type}</p>
                        </div>
                        <Line
                          options={{
                            responsive: true,
                          }}
                          data={data}
                        />
                      </Segment>
                    </Grid.Column>
                  );
                })}
              </Grid.Row>
            );
          })}
        </Grid>
      </>
    </Scroller>
  );
};
