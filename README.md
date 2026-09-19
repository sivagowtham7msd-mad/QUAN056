# QuantumFlow — Hybrid Quantum-Classical Urban Traffic Optimization Platform

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![Qiskit](https://img.shields.io/badge/Qiskit-2.5.2-6929C4.svg)](https://qiskit.org)
[![Qiskit-Aer](https://img.shields.io/badge/Qiskit--Aer-0.17.2-002D9C.svg)](https://github.com/Qiskit/qiskit-aer)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)

> **QuantumFlow** is a hackathon-ready digital twin and intelligent traffic control platform. It models urban traffic signal coordination across interconnected multi-intersection road networks as a **Quadratic Unconstrained Binary Optimization (QUBO)** problem, executes **QAOA (Quantum Approximate Optimization Algorithm)** on **Qiskit Aer simulator**, benchmarks against classical rule-based and fixed-time controllers, and deploys an automated **Emergency Green Corridor** with dynamic signal preemption.

---

## 1. Project Overview

Metropolitan traffic networks suffer from non-local congestion propagation: local greedy signal changes often create shockwaves that gridlock downstream intersections. **QuantumFlow** bridges quantum computing with real-time smart city management by:

1. Simulating an interconnected 6-intersection road network with microscopic vehicle kinematics.
2. Formulating global signal phase synchronization into a quadratic energy minimization problem ($x^T Q x$).
3. Simulating QAOA variational quantum circuits using genuine **Qiskit 2.5** and **Qiskit Aer 0.17**.
4. Benchmarking live throughput, queue length, waiting times, fuel consumption, and CO₂ emissions.
5. Providing an automated **Emergency Green Corridor** for ambulances that preempts signals and clears cross-traffic.

---

## 2. Architecture

```mermaid
graph TD
    subgraph Frontend ["React 19 + TypeScript + TailwindCSS"]
        UI[Command Dashboard & SVG Digital Twin]
        WS_CLIENT[WebSocket Live State Listener]
        OPT_VIEW[Optimization & QAOA Inspector]
        EM_VIEW[Emergency Corridor Control]
        CHARTS[Real-time Timeseries & Benchmarks]
    end

    subgraph Backend ["FastAPI Engine"]
        REST[FastAPI REST API]
        WS_SERVER[WebSocket Server (/ws/simulation)]
        SIM[Microscopic Traffic Engine]
        NET[NetworkX Graph Topology]
        QUBO[QUBO Formulation Engine]
        QAOA[QAOA Quantum Optimizer]
        CLASSICAL[Classical Rule-Based Controller]
        EMERGENCY[Emergency Preemption Engine]
        METRICS[Fuel & Emissions Metrics Engine]
    end

    subgraph Quantum ["Qiskit Aer Simulator"]
        AER[AerSimulator (Statevector / Shots)]
        COBYLA[Classical COBYLA Angle Optimizer]
    end

    UI -->|REST Controls| REST
    WS_SERVER -->|10Hz State Stream| WS_CLIENT
    SIM --> NET
    SIM --> EMERGENCY
    SIM --> METRICS
    REST --> SIM
    REST --> QUBO
    QUBO --> QAOA
    QAOA --> AER
    AER --> COBYLA
    REST --> CLASSICAL
```

---

## 3. How QUBO Formulation Works

Signal timing decisions across $N$ intersections are represented by binary choice variables $x_{i, k} \in \{0, 1\}$, where $i \in \{1, \dots, N\}$ and $k \in \{0, 1\}$ (e.g., $k=0$ corresponds to North-South priority: 42s NS / 18s EW; $k=1$ corresponds to East-West priority: 18s NS / 42s EW).

### Objective Function

$$\min_{x \in \{0, 1\}^n} \text{Cost}(x) = x^T Q x + c$$

$$\text{Cost}(x) = \sum_{i, k} x_{i, k} \left[ w_1 W_{i, k} + w_2 Q_{i, k} + w_3 C_{i, k} + w_4 E_{i, k} + w_5 \Delta_{i, k}^{\text{emerg}} \right] + \sum_{(i, j)} J_{i, j} x_{i, k} x_{j, l} + P \sum_i \left( \sum_k x_{i, k} - 1 \right)^2$$

Where:
- $W_{i, k}$: Estimated cumulative vehicle waiting time under configuration $k$.
- $Q_{i, k}$: Remaining queue spillback after green cycle.
- $C_{i, k}$: Local congestion penalty.
- $E_{i, k}$: Estimated fuel burn and CO₂ emissions.
- $\Delta_{i, k}^{\text{emerg}}$: Heavy delay penalty if intersection $i$ is part of an active emergency corridor.
- $J_{i, j}$: Inter-intersection green wave coupling (rewards synchronized green phases on adjacent connecting links).
- $P \left( \sum_k x_{i, k} - 1 \right)^2$: One-hot quadratic penalty ensuring exactly one timing option is selected per intersection.

---

## 4. How QAOA Quantum Optimization Works

1. **Mapping to Ising Spin Model**:
   Binary variables $x_i \in \{0, 1\}$ are converted to spin Pauli-$Z$ operators $Z_i \in \{+1, -1\}$ via $x_i = \frac{I - Z_i}{2}$.
   $$H_C = \sum_i h_i Z_i + \sum_{i < j} J_{ij} Z_i Z_j + \text{offset}$$

2. **Variational QAOA Ansatz**:
   An initial equal superposition state $|+\rangle^{\otimes n}$ is prepared with Hadamard gates. For $p$ layers, parameterized cost unitaries $U(C, \gamma) = e^{-i \gamma H_C}$ and mixer unitaries $U(B, \beta) = e^{-i \beta \sum X_i}$ are applied:
   $$|\psi(\gamma, \beta)\rangle = \prod_{l=1}^p e^{-i \beta_l H_M} e^{-i \gamma_l H_C} |+\rangle^{\otimes n}$$

3. **Hybrid Classical-Quantum Loop**:
   The circuit is simulated on `qiskit_aer.AerSimulator` (512–1024 shots). Classical COBYLA optimizer iteratively refines $(\gamma, \beta)$ to minimize expected energy $\langle \psi | H_C | \psi \rangle$.

4. **Decoding**:
   The lowest-energy bitstring is sampled from measurement statistics, decoded into green phase timings, and dispatched to intersection signal controllers.

---

## 5. Emergency Green Corridor

- **Spawn Ambulance**: Generates an emergency vehicle from any origin (e.g., $I_1$) to a destination (e.g., $I_6$ Metro Hospital).
- **Dijkstra Preemption**: Computes the fastest route using NetworkX while taking active road closures and accidents into account.
- **Dynamic Green Wave**: Overrides signals along the route to permanent GREEN in the direction of transit and restricts cross-traffic.
- **Telemetry**: Displays real-time Standard ETA vs Green Corridor ETA and calculates net time saved.
- **Automatic Restoration**: When the ambulance reaches its destination, normal adaptive signal rotation is restored automatically.

---

## 6. Microscopic Digital Twin Simulation

- **Network**: 6-intersection road network ($2 \times 3$ grid) with bidirectional links, speed limits, lane capacity, and right-hand driving offsets.
- **Kinematics**: Microscopic car-following, acceleration, deceleration, stop-line adherence, and queue accumulation.
- **Dynamic Events**: Localized congestion surges, vehicle collisions with road blockages, and full road closures with automated vehicle rerouting.

---

## 7. Metrics & Environmental Models

All metrics update dynamically from the microscopic simulation:
- **Average Waiting Time**: Cumulative delay of stopped vehicles at red signals.
- **Queue Length**: Vehicles queued at stop bars.
- **Throughput**: Vehicles safely clearing the network per hour.
- **Fuel Consumption**: Simulation estimate based on $1.1\text{ L/hr}$ idling penalty $+ 4.2\text{ L/100km}$ cruising load.
- **CO₂ Emissions**: Estimated at $2.31\text{ kg CO}_2$ per liter of gasoline burned.
- **Side-by-Side Comparison**: Direct performance comparison of **Classical Baseline** vs **Hybrid Quantum-Classical**.

---

## 8. Installation & Setup

### Prerequisites
- Python 3.10, 3.11, or 3.12 (Python 3.11 recommended)
- Node.js 18+ & npm
- Git

### Backend Setup
```bash
# 1. Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Verify quantum backend
python test_backend.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run build
```

---

## 9. Running the Platform Locally

### Start Backend Server
From the root workspace directory:
```bash
.\.venv\Scripts\uvicorn.exe backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

### Start Frontend Dev Server
In a separate terminal:
```bash
cd frontend
npm.cmd run dev
```
The application will launch at `http://localhost:5173`.

---

## 10. Automated 1-Click Demo Mode

For hackathon judges and rapid evaluations, click the **1-Click Demo Mode** button in the header. The system will automatically execute the complete 9-step showcase sequence:
1. Start simulation engine.
2. Surge traffic demand to High.
3. Inject congestion at Downtown ($I_2$).
4. Run Classical Rule-Based optimization.
5. Spawn Emergency Ambulance from $I_1$ to $I_6$ Hospital.
6. Activate Green Corridor with dynamic signal preemption.
7. Execute QUBO formulation and QAOA on Qiskit Aer.
8. Complete emergency transit and restore normal flow.
9. Present side-by-side Classical vs Hybrid Quantum benchmarks.

---

## 11. Limitations & Future Improvements

- **Scalability**: Simulated on a 6-intersection network with compact decision variables to ensure interactive 1-2 second response times during live presentations.
- **Hardware Execution**: Ready to target IBM Quantum superconducting hardware via Qiskit Runtime Service with IBM Quantum API tokens.
- **Reinforcement Learning**: Future roadmap includes combining QAOA state initialization with multi-agent deep Q-learning (MADRL).

---

## License
MIT License. Built for hackathon demonstration.
