import { Router } from 'express';
import { PluggyClient } from 'pluggy-sdk';

const router = Router();

const getPluggyClient = () => {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('As credenciais do Open Finance não estão configuradas. Por favor, adicione PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET nas configurações de ambiente.');
  }
  
  return new PluggyClient({
    clientId,
    clientSecret,
  });
};

router.post('/token', async (req, res) => {
  try {
    const client = getPluggyClient();
    const token = await client.createConnectToken();
    res.json({ token: token.accessToken });
  } catch (error: any) {
    console.error('Error generating pluggy token:', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar token de conexão.' });
  }
});

router.post('/data', async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'ID de conexão (itemId) é obrigatório.' });
    }
    
    const client = getPluggyClient();
    const item = await client.fetchItem(itemId);
    
    if (item.status !== 'UPDATED') {
       return res.status(400).json({ error: 'A conexão bancária ainda não concluiu a sincronização. Status: ' + item.status });
    }
    
    const accounts = await client.fetchAccounts(itemId);
    
    // Filter out highly sensitive data, keeping only read-only safe visualization data
    const safeAccounts = accounts.results.map(acc => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      balance: acc.balance,
      currencyCode: acc.currencyCode,
      number: acc.number ? `****${acc.number.slice(-4)}` : null,
      bankData: acc.bankData
    }));
    
    res.json({ accounts: safeAccounts });
  } catch (error: any) {
    console.error('Error fetching pluggy data:', error);
    res.status(500).json({ error: error.message || 'Falha ao sincronizar dados bancários.' });
  }
});

export default router;
