const express = require('express')
const app = express();
var cors = require('cors');
const port = 3001;

app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173']
}))

const { Pool } = require('pg')
const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1234',
    port: 5432
}
const initMySQL = async() => {
    pool = new Pool(config);
}

app.listen(port, async (req, res) => {
    await initMySQL()
    console.log('http server run at ' + port)
})

app.get('/api/panorama', async (req, res) => {
    try{
    const results = await pool.query("SELECT id, name, encode(image, 'base64') AS image, lat, lon, yaw, type, source FROM panorama_images ORDER BY id ASC");
    const data = results.rows
    res.status(200).json({data});
    
    } catch (error) {
    res.json({error: error});

    }
  });

app.get('/api/tour', async (req, res) => {
try{
const results = await pool.query("SELECT id, name, encode(image, 'base64') AS image, lat, lon, yaw, type, source, north_offset FROM panorama_images WHERE type = 'tour' ORDER BY id ASC");
const data = results.rows
res.status(200).json({data});

} catch (error) {
res.json({error: error});

}
});