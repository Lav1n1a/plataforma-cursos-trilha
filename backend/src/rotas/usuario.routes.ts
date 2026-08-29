import { Router } from "express";
import { AuthMiddleware } from "@/middlewares/auth";
import { CriarUsuarioController } from "@/usuarios/controllers/CriarUsuarioController";
import { InMemoryUserRepository } from "@/usuarios/repositories/prisma/InMemoryUserRepository";
import { CriarUsuarioUseCase } from "@/usuarios/useCases/CriarUsuarioUseCase";
import { BuscarUsuarioPorEmailUseCase } from "@/usuarios/useCases/BuscarUsuarioPorEmail";
import { BuscarUsuarioPorEmailController } from "@/usuarios/controllers/BuscarUsuarioPorEmailController";
import { AutenticarUsuarioUseCase } from "@/usuarios/useCases/AutenticarUsuario";
import { AutenticarUsuarioController } from "@/usuarios/controllers/AutenticarUsuarioController";

const usuarioRoutes = Router();

//Composition Root
const userRepository = new InMemoryUserRepository();

const authMiddleware = new AuthMiddleware(userRepository);

const auth = authMiddleware.execute;

const criarUsuarioUseCase = new CriarUsuarioUseCase(userRepository);
const criarUsuarioController = new CriarUsuarioController(criarUsuarioUseCase);
const buscarUsuarioUseCase = new BuscarUsuarioPorEmailUseCase(userRepository);
const buscarUsuarioController = new BuscarUsuarioPorEmailController(buscarUsuarioUseCase);
const autenticarUsuarioUseCase = new AutenticarUsuarioUseCase(userRepository);
const autenticarUsuarioController = new AutenticarUsuarioController(autenticarUsuarioUseCase);

usuarioRoutes.post("/login", (req, res) => autenticarUsuarioController.handle(req, res));

usuarioRoutes.use(auth);

usuarioRoutes.post("/usuarios", (req, res) => criarUsuarioController.handle(req, res));

usuarioRoutes.get("/usuarios", (req, res) => buscarUsuarioController.handle(req, res));

usuarioRoutes.get("/me", (req, res) => {
    return res.status(200).json(req.user);
});

export { usuarioRoutes }
