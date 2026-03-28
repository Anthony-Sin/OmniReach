import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/sort-log', (req: Request, res: Response) => {
    const { itemId, classification, destination } = req.body;
    console.log(`[Audit] Item ${itemId}: ${classification} routed to ${destination}`);
    
    res.status(201).send({ message: "Sort decision logged successfully." });
});

app.listen(PORT, () => {
    console.log(`OmniReach Server running on http://localhost:${PORT}`);
});