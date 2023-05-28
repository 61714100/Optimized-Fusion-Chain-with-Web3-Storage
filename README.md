# Optimized-Fusion-Chain-with-Web3-Storage
I have developed this project using the  web3 storage along with the lightweight block structure of existing fusion chain. Moreover, I have included implementation of  both  PBFT and RAFT consensus algorithms.

- Please follow the below mentioned two steps

  - Step 1 Install Packages

    - copy this command and paste in command prompt / bash -> npm run install:all

  - Step 2 Run Server

    - copy this command and paste in command prompt / bash -> npm run start

"install:all": "npm i concurrently && concurrently -c \"auto\" \"npm install\" \"npm --prefix ./ui install\" ",
"start": "concurrently -c \"auto\" \"npm run run:node1\" \"delay 5 && npm run run:node2\" \"delay 10 && npm run run:node3\" \"delay 15 && npm --prefix ./ui run build && npm --prefix ./ui run preview\" ",
"dev": "concurrently -c \"auto\" \"npm run run:node1\" \"delay 5 && npm run run:node2\" \"delay 10 && npm run run:node3\" \"delay 15 && npm --prefix ./ui run dev\" ",
"run:node1": "cross-env DEVICE=\"Smart Home\" SECRET=\"NODE0\" P2P_PORT=5000 HTTP_PORT=3000 node app",
"run:node2": "cross-env DEVICE=\"Surveillance\" SECRET=\"NODE1\" P2P_PORT=5001 HTTP_PORT=3001 PEERS=ws://localhost:5000 node app",
"run:node3": "cross-env DEVICE=\"Smart Vehicle\" SECRET=\"NODE2\" P2P_PORT=5002 HTTP_PORT=3002 PEERS=ws://localhost:5001,ws://localhost:5000 node app",


