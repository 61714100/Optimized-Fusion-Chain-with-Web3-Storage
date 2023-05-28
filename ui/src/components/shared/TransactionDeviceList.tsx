import {
  Checkbox,
  CheckboxProps,
  Icon,
  Loader,
  Table,
} from "semantic-ui-react";
import dayjs from "dayjs";

import { ITransaction } from "../../utils/types";
import { useEffect, useState } from "react";
import { createTransactionApi, getDataFromCID } from "../../utils/api";
import { DEVICE_TURNED_DATE_FORMAT } from "../../utils/constants";

interface ITransactionDeviceList {
  transactionId: string;
  transactions: [
    {
      data: string;
      timestamp: string;
      fileName: string;
    }
  ];
}

export const TransactionDeviceList: React.FC<ITransactionDeviceList> = (
  props
) => {
  const [loader, setLoader] = useState(false);
  const [transaction, setTransaction] = useState<ITransaction>(
    {} as ITransaction
  );

  useEffect(() => {
    setLoader(true);
    props?.transactions?.sort((a, b) => {
      if (a.timestamp < b.timestamp) {
        return 1;
      } else if (a.timestamp > b.timestamp) {
        return -1;
      } else {
        return 0;
      }
    });

    getDataFromCID(
      props?.transactions?.length > 0 ? props?.transactions[0]?.data : "",
      props?.transactions?.length > 0 ? props?.transactions[0]?.fileName : ""
    )
      .then((response) => {
        const data = response.data as ITransaction;

        data.lastTurnedOff = data.lastTurnedOff
          ? dayjs(data.lastTurnedOff).format(DEVICE_TURNED_DATE_FORMAT)
          : "";
        data.lastTurnedOn = data.lastTurnedOn
          ? dayjs(data.lastTurnedOn).format(DEVICE_TURNED_DATE_FORMAT)
          : "";

        if (!data.lastTurnedOff) {
          const seconds = dayjs().diff(dayjs(data.lastTurnedOn), "second");
          const hour = seconds / 60 / 60;
          data.usage = (hour * data.watt) / 1000;
        } else {
          const seconds = dayjs(data.lastTurnedOff).diff(
            dayjs(data.lastTurnedOn),
            "second"
          );
          const hour = seconds / 60 / 60;
          data.usage = (hour * data.watt) / 1000;
        }

        setTransaction(data);
      })
      .finally(() => {
        setLoader(false);
      });
  }, []);

  const handleToggleCheckbox = (_: any, data: CheckboxProps) => {
    setLoader(true);

    const newTransaction = { ...transaction };
    newTransaction.switch = data.checked!;

    if (newTransaction.switch) {
      newTransaction.lastTurnedOn = dayjs(new Date()).format(
        DEVICE_TURNED_DATE_FORMAT
      );
      newTransaction.lastTurnedOff = "";
    } else {
      newTransaction.lastTurnedOff = dayjs(new Date()).format(
        DEVICE_TURNED_DATE_FORMAT
      );
    }

    createTransactionApi(newTransaction!)
      .then(() => {
        setTransaction(newTransaction);
      })
      .finally(() => {
        setLoader(false);
      });
  };

  return (
    <Table.Row>
      <Table.Cell className=" bg-gray-200 flex items-center justify-center">
        {!loader ? (
          <Checkbox
            slider
            checked={transaction.switch}
            onChange={handleToggleCheckbox}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <Loader active size="small" indeterminate inline /> */}
            <Icon loading name="spinner" />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        {!loader ? (
          transaction?.type
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <Loader active size="small" indeterminate inline /> */}
            <Icon loading name="spinner" />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        {!loader ? (
          transaction?.name
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <Loader active size="small" indeterminate inline /> */}
            <Icon loading name="spinner" />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        {!loader ? (
          `${transaction?.watt} W`
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <Loader active size="small" indeterminate inline /> */}
            <Icon loading name="spinner" />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        {!loader ? (
          transaction?.usage?.toFixed(2)
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <Loader active size="small" indeterminate inline /> */}
            <Icon loading name="spinner" />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        {!loader ? (
          transaction?.lastTurnedOn
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <Loader active size="small" indeterminate inline /> */}
            <Icon loading name="spinner" />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        {!loader ? (
          transaction?.lastTurnedOff
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* <Loader active size="small" indeterminate inline /> */}
            <Icon loading name="spinner" />
          </div>
        )}
      </Table.Cell>
    </Table.Row>
  );
};
