import { useEffect, useRef, useState } from "react";
import { Accordion, Icon } from "semantic-ui-react";
import { INodeData, IRealTimeSocket } from "../../utils/types";
import { MESSAGE_TYPE } from "../../utils/constants";

export const RealTimeSocket: React.FC<IRealTimeSocket> = (props) => {
  const [isConnected, setIsConnected] = useState(false);
  const [nodeData, setNodeData] = useState<INodeData>();
  const socket = useRef<WebSocket>();

  useEffect(() => {
    socket.current = new WebSocket(props.connection);

    socket.current.onopen = onOpen;
    socket.current.onmessage = onMessage;
    socket.current.onerror = onError;

    return () => {
      socket.current?.close();
    };
  }, []);

  const onOpen = () => {
    setIsConnected(true);
    socket.current?.send(
      JSON.stringify({
        type: MESSAGE_TYPE.request_node_data,
      })
    );

    console.log("NEW CONNECTION OPENED.");
  };

  const onMessage = (evt: any) => {
    const { type, data } = JSON.parse(evt?.data || "{}");

    if (type === "RESPONSE_NODE_DATA") {
      setNodeData(data);
    }
  };

  const onError = (e: any) => {
    console.log("error", e);
  };

  return (
    <Accordion fluid styled className="mt-4">
      <Accordion.Title active>
        <Icon
          name="circle"
          className={isConnected ? "text-green-400" : "text-red-400"}
        />
        <span className="font-bold ml-2">Node {props.node + 1}</span>
      </Accordion.Title>
      <Accordion.Content active>
        <p>Metrics</p>
      </Accordion.Content>
    </Accordion>
  );
};
