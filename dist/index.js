"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const uuid_1 = require("uuid");
const app_1 = require("firebase/app");
const database_1 = require("firebase/database");
const cors_1 = __importDefault(require("cors"));
// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCTY7evt1hiUKwnGvl9etHnvLJ0YQT-8sQ",
    authDomain: "convidados-ellen-db.firebaseapp.com",
    projectId: "convidados-ellen-db",
    storageBucket: "convidados-ellen-db.appspot.com",
    messagingSenderId: "180645652218",
    appId: "1:180645652218:web:eba86837646afb44cbcb43",
};
const firebaseApp = (0, app_1.initializeApp)(firebaseConfig);
const db = (0, database_1.getDatabase)(firebaseApp);
// ==========================================================
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
// Rotas CRUD para convidados
app.get("/convidados", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const convidadosRef = (0, database_1.ref)(db, "convidados");
        const convidadosSnapshot = yield (0, database_1.get)(convidadosRef);
        if (convidadosSnapshot.exists()) {
            const convidados = convidadosSnapshot.val();
            res.json(Object.values(convidados));
        }
        else {
            res.json([]);
        }
    }
    catch (error) {
        console.error("Erro ao buscar convidados:", error);
        res.status(500).json({ message: "Erro ao buscar convidados" });
    }
}));
app.get("/convidados/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const convidadoRef = (0, database_1.ref)(db, `convidados/${id}`);
    const convidadoSnapshot = yield (0, database_1.get)(convidadoRef);
    if (convidadoSnapshot.exists()) {
        const convidado = convidadoSnapshot.val();
        res.json(convidado);
    }
    else {
        res.status(404).json({ message: "Convidado não encontrado" });
    }
}));
app.post("/convidados", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome, confirmado } = req.body;
    if (!nome || typeof confirmado !== "boolean") {
        return res
            .status(400)
            .json({ message: "Nome e confirmado são campos obrigatórios" });
    }
    const id = (0, uuid_1.v4)();
    const convidadoRef = (0, database_1.ref)(db, `convidados/${id}`);
    try {
        yield (0, database_1.set)(convidadoRef, { id, nome, confirmado });
        res.status(201).json({ id, nome, confirmado });
    }
    catch (error) {
        console.error("Erro ao criar convidado:", error);
        res.status(500).json({ message: "Erro ao criar convidado" });
    }
}));
app.put("/convidados/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nome, confirmado } = req.body;
    const convidadoRef = (0, database_1.ref)(db, `convidados/${id}`);
    const convidadoSnapshot = yield (0, database_1.get)(convidadoRef);
    if (convidadoSnapshot.exists()) {
        try {
            yield (0, database_1.update)(convidadoRef, { nome, confirmado });
            res.json({ id, nome, confirmado });
        }
        catch (error) {
            console.error("Erro ao atualizar convidado:", error);
            res.status(500).json({ message: "Erro ao atualizar convidado" });
        }
    }
    else {
        res.status(404).json({ message: "Convidado não encontrado" });
    }
}));
function formatString(inputString) {
    // Substitui hífens por espaços
    const stringWithSpaces = inputString.replace(/-/g, " ");
    // Remove acentos
    const stringWithoutAccents = stringWithSpaces
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    return stringWithoutAccents.toLowerCase();
}
app.put("/confirmar-convidado", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ message: "Nome é um campo obrigatório" });
    }
    try {
        const convidadosRef = (0, database_1.ref)(db, "convidados");
        const convidadosSnapshot = yield (0, database_1.get)(convidadosRef);
        if (convidadosSnapshot.exists()) {
            const convidados = convidadosSnapshot.val();
            const convidadoId = Object.keys(convidados).find((key) => formatString(convidados[key].nome) === formatString(nome));
            if (convidadoId) {
                const convidadoRef = (0, database_1.ref)(db, `convidados/${convidadoId}`);
                const convidadoSnapshot = yield (0, database_1.get)(convidadoRef);
                if (convidadoSnapshot.exists()) {
                    const convidado = convidadoSnapshot.val();
                    if (!convidado.confirmado) {
                        yield (0, database_1.update)(convidadoRef, { confirmado: true });
                        res.json({ message: "Convidado confirmado com sucesso" });
                    }
                    else {
                        res.json({ message: "Convidado já confirmado" });
                    }
                }
                else {
                    res.status(404).json({ message: "Convidado não encontrado" });
                }
            }
            else {
                res.status(404).json({ message: "Convidado não encontrado" });
            }
        }
        else {
            res.json([]);
        }
    }
    catch (error) {
        console.error("Erro ao confirmar convidado:", error);
        res.status(500).json({ message: "Erro ao confirmar convidado" });
    }
}));
app.delete("/convidados/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const convidadosRef = (0, database_1.ref)(db, "convidados");
    try {
        // Define o valor de "convidados" como um objeto vazio para excluir todos os convidados
        yield (0, database_1.set)(convidadosRef, {});
        res.status(204).send();
    }
    catch (error) {
        console.error("Erro ao excluir todos os convidados:", error);
        res.status(500).json({ message: "Erro ao excluir todos os convidados" });
    }
}));
app.delete("/convidados/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const convidadoRef = (0, database_1.ref)(db, `convidados/${id}`);
    try {
        const convidadoSnapshot = yield (0, database_1.get)(convidadoRef);
        if (convidadoSnapshot.exists()) {
            yield (0, database_1.remove)(convidadoRef);
            res.status(204).send();
        }
        else {
            res.status(404).json({ message: "Convidado não encontrado" });
        }
    }
    catch (error) {
        console.error("Erro ao excluir convidado:", error);
        res.status(500).json({ message: "Erro ao excluir convidado" });
    }
}));
// ==================================================================
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
//# sourceMappingURL=index.js.map