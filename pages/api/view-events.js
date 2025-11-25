// pages/api/view-events.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
        'Supabase env vars faltando (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)'
    );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    if (!supabaseUrl || !supabaseServiceKey) {
        return res
            .status(500)
            .json({ error: 'Supabase não configurado no servidor.' });
    }

    if (req.method === 'POST') {
        try {
            const { channel, viewerCount, isLive } = req.body || {};

            if (!channel) {
                return res.status(400).json({ error: 'channel é obrigatório.' });
            }

            const { error } = await supabase.from('view_events').insert({
                channel,
                viewer_count: viewerCount,
                is_live: isLive
            });

            if (error) {
                console.error('Erro Supabase insert:', error);
                return res.status(500).json({ error: 'Erro ao gravar evento.' });
            }

            return res.status(200).json({ ok: true });
        } catch (err) {
            console.error('Erro POST /view-events:', err);
            return res.status(500).json({ error: 'Erro interno.' });
        }
    }

    if (req.method === 'GET') {
        try {
            const { channel = 'gaules', limit = 500 } = req.query;

            const { data, error } = await supabase
                .from('view_events')
                .select('*')
                .eq('channel', channel)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit, 10) || 500);

            if (error) {
                console.error('Erro Supabase select:', error);
                return res.status(500).json({ error: 'Erro ao buscar histórico.' });
            }

            return res.status(200).json({ events: data });
        } catch (err) {
            console.error('Erro GET /view-events:', err);
            return res.status(500).json({ error: 'Erro interno.' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
