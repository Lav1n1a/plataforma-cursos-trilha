import 'dotenv/config';
import express  from "express";
import { usuarioRoutes } from "./rotas/usuario.routes";

const app = express()
app.use(express.json())
app.use(usuarioRoutes)

app.listen(3333, () => {
    console.log('Ouvindo porta 3333');
});