import {
  Button,
  Checkbox,
  Dropdown,
  Icon,
  Input,
  Loader,
  Modal,
  Table,
} from "semantic-ui-react";
import { v4 as uuidV4 } from "uuid";

import { Scroller } from "../shared/Scroller";
import { useEffect, useState } from "react";
import { IDeviceOption, IModalForm, ITransaction } from "../../utils/types";
import { DEVICES_LIST, DEVICE_TURNED_DATE_FORMAT } from "../../utils/constants";
import { createTransactionApi, getDevicesApi } from "../../utils/api";
import { TransactionDeviceList } from "../shared/TransactionDeviceList";
import dayjs from "dayjs";

export const Devices = () => {
  const [loader, setLoader] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionForm, setTransactionForm] = useState<ITransaction>(
    {} as ITransaction
  );
  const [submitLoader, setSubmitLoader] = useState(false);

  useEffect(() => {
    getDevicesApi()
      .then((response) => {
        setTransactions(response?.data);
      })
      .finally(() => {
        setTimeout(() => {
          setLoader(false);
        }, 1000);
      });
  }, []);

  const toggleOpenModal = () => {
    setOpenModal((prevOpenModal) => {
      return !prevOpenModal;
    });
  };

  const handleSelectDevice = (deviceOption: IDeviceOption) => {
    setTransactionForm(() => {
      return {
        id: uuidV4().toString(),
        switch: false,
        type: deviceOption.name!,
        name: "",
        watt: deviceOption.watt!,
        usage: 0,
        lastTurnedOff: "",
        lastTurnedOn: "",
      };
    });
  };

  const handleSubmitForm = () => {
    setSubmitLoader(true);

    transactionForm.switch = true;
    transactionForm.lastTurnedOn = dayjs(new Date()).format(
      DEVICE_TURNED_DATE_FORMAT
    );
    createTransactionApi(transactionForm!)
      .then(() => {
        getDevicesApi().then((response) => {
          setTransactions(response?.data);
        });
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setTransactionForm({} as ITransaction);
        setSubmitLoader(false);
        setOpenModal(false);
      });
  };

  if (loader) {
    return <Loader active />;
  }

  return (
    <Scroller>
      <>
        <p className="italic text-gray-400">
          Added Devices Are Listed Here, Can Able To Modify Device State.
        </p>
        <div className="mt-4 sticky top-0 w-[inherit] h-auto bg-white z-10">
          <p className="text-gray-400 italic mb-4"> </p>
          <Button icon color="black" onClick={toggleOpenModal}>
            <Icon className="relative top-px" name="add" size="small" />
            <span className="ml-2 font-bold">Add Device</span>
          </Button>
        </div>

        <Table className="overflow-hidden" compact celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="font-bold">Switch</Table.HeaderCell>
              <Table.HeaderCell className="font-bold">Device</Table.HeaderCell>
              <Table.HeaderCell className="font-bold">Name</Table.HeaderCell>
              <Table.HeaderCell className="font-bold">
                Watt (W)
              </Table.HeaderCell>
              <Table.HeaderCell className="font-bold">
                Total Usage (1KWH = 1 unit)
              </Table.HeaderCell>
              <Table.HeaderCell className="font-bold">
                Last Turned ON
              </Table.HeaderCell>
              <Table.HeaderCell className="font-bold">
                Last Turned OFF
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {transactions.length > 0 &&
              transactions.map((transaction) => {
                return (
                  <TransactionDeviceList
                    key={transaction?.transactionId}
                    {...transaction}
                  />
                );
              })}
          </Table.Body>

          {transactions.length === 0 && (
            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan="7">
                  <p className="text-center font-bold">No Devices Added Yet.</p>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          )}
        </Table>

        <Modal open={openModal} size="tiny">
          <Modal.Header>Add New Device</Modal.Header>
          <Modal.Content>
            <Modal.Description>
              <div>
                <label className="font-bold">Device Type</label>
                <Dropdown
                  className="mt-1"
                  name="transactions"
                  placeholder="Select Device"
                  key={transactionForm?.type}
                  text={transactionForm?.type}
                  value={transactionForm?.type}
                  fluid
                  selection
                >
                  <Dropdown.Menu>
                    {DEVICES_LIST.map((device) => (
                      <Dropdown.Item
                        key={device.name}
                        active={transactionForm?.type === device.name}
                        onClick={() => handleSelectDevice(device)}
                      >
                        {device.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div className="mt-4">
                <label className="font-bold">Device Name</label>
                <Input
                  className="mt-1"
                  type="text"
                  placeholder="Device Name"
                  value={transactionForm?.name}
                  onChange={(e) =>
                    setTransactionForm((prevDeviceForm) => ({
                      ...prevDeviceForm!,
                      name: e.target.value,
                    }))
                  }
                  fluid
                />
              </div>
              <div className="mt-4">
                <label className="font-bold">Device Watts</label>
                <Input
                  className="mt-1"
                  type="text"
                  placeholder="Device Watts"
                  value={transactionForm?.watt}
                  onChange={(e) =>
                    setTransactionForm((prevDeviceForm) => ({
                      ...prevDeviceForm!,
                      watt: Number(e.target.value),
                    }))
                  }
                  fluid
                />
              </div>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button
              color="red"
              onClick={toggleOpenModal}
              disabled={submitLoader}
            >
              Cancel
            </Button>
            <Button
              color="green"
              onClick={handleSubmitForm}
              disabled={submitLoader}
              loading={submitLoader}
            >
              Submit
            </Button>
          </Modal.Actions>
        </Modal>
      </>
    </Scroller>
  );
};
