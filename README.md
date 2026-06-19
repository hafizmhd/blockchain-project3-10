# Todo List dApp

## Deskripsi
Decentralized Todo List application yang berjalan di atas Ethereum blockchain. Setiap user dapat membuat, menyelesaikan, dan menghapus task mereka sendiri. Data task disimpan secara permanen di smart contract, sehingga tidak dapat dimanipulasi oleh pihak lain. Setiap user hanya dapat mengakses task miliknya sendiri melalui wallet address.

## Anggota Kelompok
| Nama | NRP | Kontribusi |
|------|-----|------------|
| Ahmad Hafiz Mahardika | 5025201196 | Smart Contract, Frontend, Deploy |

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Smart Contract**: Solidity 0.8.28 + Hardhat 3
- **Web3 Library**: ethers.js v6
- **Wallet**: MetaMask
- **Network**: Hardhat Local Node (localhost:8545)

## Fitur
- [x] **Connect Wallet** — Menghubungkan MetaMask ke aplikasi, menampilkan address dan saldo ETH
- [x] **Add Task** (Write) — Menambahkan task baru dengan judul dan deadline ke smart contract
- [x] **Get Tasks** (Read) — Membaca daftar task milik user dari smart contract\
- [x] **Mark Completed** (Write) — Menandai task sebagai selesai di smart contract
- [x] **Delete Task** (Write) — Menghapus task dari smart contract
- [x] **Loading States** — Notifikasi banner saat transaksi pending/berhasil/gagal
- [x] **Error Handling** — Pesan error user-friendly untuk berbagai kasus (wallet belum terhubung, transaksi ditolak, network salah, dll.)\

## Smart Contract

### Contract: `ToDoList.sol`

| Fungsi | Tipe | Deskripsi |
|--------|------|-----------|
| `addTask(string, uint256)` | Write | Menambahkan task baru dengan judul dan deadline (unix timestamp) |
| `markCompleted(uint256)` | Write | Menandai task sebagai selesai berdasarkan task ID |
| `deleteTask(uint256)` | Write | Menghapus task berdasarkan task ID (swap-and-pop) |
| `getTasks()` | Read | Mengambil semua task milik `msg.sender` |

### Events
- `TaskAdded(address indexed user, uint256 taskId)`
- `TaskCompleted(address indexed user, uint256 taskId)`
- `TaskDeleted(address indexed user, uint256 taskId)`

## Struktur Frontend

```
frontend/src/
├── components/
│   ├── ConnectWallet.tsx   # Komponen connect/disconnect wallet
│   ├── AddTask.tsx         # Form tambah task baru
│   ├── TaskList.tsx        # Daftar semua task (panggil getTasks)
│   └── TaskItem.tsx        # Item task individual (complete/delete)
├── utils/
│   ├── contract.ts         # Contract address & chain ID config
│   └── ToDoList.json       # ABI smart contract
├── App.tsx                 # Komponen utama & state management
├── App.css                 # Styling aplikasi
├── index.css               # CSS reset & base styles
└── main.tsx                # Entry point React
```

## Cara Menjalankan

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Git

### 1. Clone Repository
```bash
git clone https://github.com/hafizmhd/blockchain-project3-10
cd blockchain-project3-10
```

### 2. Install Dependencies
```bash
# Root folder (smart contract)
npm install

# Frontend folder
cd frontend
npm install
```

### 3. Jalankan Local Blockchain
```bash
# Di terminal pertama
npx hardhat node
```
Hardhat akan menjalankan local blockchain di `http://127.0.0.1:8545/` dan menampilkan 20 test accounts beserta private key-nya.

### 4. Deploy Smart Contract
```bash
# Di terminal baru (tetap di root project)
npx hardhat run scripts/deploy.ts
```
Output akan menampilkan contract address, contoh:
```
Deploying ToDoList contract...
ToDoList deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 5. Update Contract Address
Copy address dari output deploy, lalu update di file `frontend/src/utils/contract.ts`:
```ts
export const CONTRACT_ADDRESS = "<alamat dari output deploy>";
```

### 6. Setup MetaMask
1. Buka MetaMask → **Settings** → **Networks** → **Add Network**
2. Isi dengan:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
3. **Import Account**: Copy salah satu private key dari output `npx hardhat node`, lalu import ke MetaMask via **Import Account**

### 7. Jalankan Frontend
```bash
cd frontend
npm run dev
```

### 8. Buka Browser
Buka [http://localhost:5173](http://localhost:5173), klik **Connect Wallet**, dan mulai tambahkan task.

## Contract Address
- Local (default first deploy): `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

> **Note**: Address dapat berubah jika deploy dilakukan lebih dari sekali pada node yang sama. Selalu update di `frontend/src/utils/contract.ts`.

## Demo
[Link video demo atau GIF]

## Screenshot
State Sebelum Wallet Terhubung
<img width="1909" height="913" alt="image" src="https://github.com/user-attachments/assets/937cbf32-52da-42ce-a7a8-13f300ebcf7d" />

Wallet Connected
<img width="1908" height="923" alt="image" src="https://github.com/user-attachments/assets/9f0bd09a-4510-46c0-a22d-4c3c0370fb11" />

Write Pending
<img width="1907" height="917" alt="image" src="https://github.com/user-attachments/assets/52dfa02f-3eb2-4dad-8b2d-265e61f804ee" />
<img width="1908" height="902" alt="image" src="https://github.com/user-attachments/assets/f37a3991-8be5-4a59-b2a0-c4b2c7335b12" />

Write Success
<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/b8deaa99-022d-45e5-a5e8-91cfe746d5a8" />

Error Handling
<img width="1914" height="852" alt="image" src="https://github.com/user-attachments/assets/16599d52-1aaa-4844-bb21-2d890c594cd4" />
<img width="1919" height="872" alt="image" src="https://github.com/user-attachments/assets/797e890b-5583-40c7-ada8-59a4256fe8f2" />
