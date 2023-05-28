import { Tab, Sticky } from "semantic-ui-react";

import "./app.scss";
import { Peers } from "./components/tabs/Peers";
import { Blocks } from "./components/tabs/Blocks";
import { Transactions } from "./components/tabs/Transactions";
import { Devices } from "./components/tabs/Devices";
import { Metrics } from "./components/tabs/Metrics";
import Result from "./components/tabs/Result";

function App() {
  return (
    <div className="w-screen h-screen p-8 bg-gray-200">
      <div className="w-full h-full overflow-hidden bg-white p-8 border-0 rounded-md shadow-2xl">
        <div>
          <h2>Home Automation System</h2>
          <Tab
            renderActiveOnly
            menu={{
              secondary: true,
              pointing: true,
            }}
            panes={[
              {
                menuItem: "Devices",
                render: () => <Devices />,
              },
              {
                menuItem: "Metrics",
                render: () => <Metrics />,
              },
              {
                menuItem: "Peers",
                render: () => <Peers />,
              },
              {
                menuItem: "Blocks",
                render: () => <Blocks />,
              },
              {
                menuItem: "Transactions",
                render: () => <Transactions />,
              },
              {
                menuItem: "Comparison",
                render: () => <Result />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
