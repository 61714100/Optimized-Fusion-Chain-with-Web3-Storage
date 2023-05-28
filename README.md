# Optimized-Fusion-Chain-with-Web3-Storage
This project is developed upon the design and implementation of the core idea of fusion chain blockchain with better storage along with the lightweight block srtructure of  existing fusion chain. Moreover, it includes the development of both the PBFT and RAFT consensus algorithms to balance the CPU power consumption.

The existing fusion chain github code can be found at https://github.com/sslab-kmu/Fusion-Chain .


- Please follow the below mentioned two steps to run the code:

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


Some Specification in order to run the code without any hassel:
(1)The code has been tested in M1 processor Macbook Pro with 8GB RAM, which can run two nodes perfectly at a time. One should use  M1 Processor 16GB Macbook Pro or high processor local machine with 64GB or 128GB machine with windows and linux in order to add more nodes to the application.

(2)Software Tools to be used:
(a) Visual Studio 2022 version 17.5
(b)Filecoin network v17 shark
(c)node 18.12.0
(d)npm 8
(e)Web3 1.9.0
(f)React 17
(g)Jscript ES8
(h)PBFT Typescript 4.9
(i)Fusionchain API 5.0.2
(j)Bootstrap library 4.6.0

