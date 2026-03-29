import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { RoboticsAgent } from './src/agents/RoboticsAgent';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { CoordinatorAgentClass, coordinatorAgent } from './src/agents/CoordinatorAgent';
import { missionStore } from './src/lib/missionStore';
import { MissionEventType } from './src/types/mission';
import { MOCK_INVENTORY } from './src/lib/pickPlanner';
import { InventoryAgent } from './src/agents/InventoryAgent';
import { workerQueues } from './src/lib/workerQueue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Initialize Aegis Coordinator
  console.log('Initializing Aegis Coordinator...');
  CoordinatorAgentClass.init();
  InventoryAgent.init();
  
  const unsubscribe = coordinatorAgent.onMessage((event) => {
    // Broadcast mission events to all connected clients
    io.emit('mission_event', event);
    const mission = missionStore.getMission(event.missionId);
    if (mission) {
      io.emit('mission_state', mission);
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    socket.on('robotics_complete', async (data) => {
      const { missionId, armId } = data;
      console.log(`[Socket] Received robotics_complete for mission ${missionId} on arm ${armId}`);
      
      // We need to trigger the completion logic in RoboticsAgent
      // Since RoboticsAgent is static, we can call a method on it.
      // But we need the 'context' which is usually passed via ADK.
      // We can store a reference to the coordinator agent to send messages.
      
      const mission = missionStore.getMission(missionId);
      if (mission) {
        // We'll add a static method to RoboticsAgent to handle this external completion
        await (RoboticsAgent as any).handleExternalCompletion(missionId, armId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Aegis System Online' });
  });

  app.get('/api/system/queues', (req, res) => {
    res.json(workerQueues.snapshot());
  });

  // Handle supply level updates
  app.post('/api/inventory/supply-level', express.json(), (req, res) => {
    const { level } = req.body;
    if (['low', 'medium', 'high'].includes(level)) {
      InventoryAgent.setSupplyLevel(level);
      io.emit('supply_level_changed', { level });
      res.json({ success: true, level });
    } else {
      res.status(400).json({ error: 'Invalid supply level' });
    }
  });

  app.get('/api/inventory/stock', (req, res) => {
    const items = Object.keys(MOCK_INVENTORY);
    const stock = items.map(item => ({
      name: item,
      ...InventoryAgent.query(item)
    }));
    res.json(stock);
  });

  // Handle manual mission triggers if needed
  app.post('/api/missions/start', express.json(), async (req, res) => {
    try {
      const { zone } = req.body;
      const missionId = await CoordinatorAgentClass.startNewMission(zone);
      
      // Send initial mission state to client
      const mission = missionStore.getMission(missionId);
      if (mission) {
        io.emit('mission_init', mission);
        io.emit('mission_state', mission);
      }
      
      res.json({ missionId });
    } catch (error) {
      console.error('Failed to start mission:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Aegis Command Center running on http://localhost:${PORT}`);
  });

  // Cleanup on shutdown
  process.on('SIGTERM', () => {
    unsubscribe();
    httpServer.close();
  });
}

startServer().catch(console.error);
