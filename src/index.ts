import express from "express";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update, remove, set } from "firebase/database";
import cors from "cors";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCTY7evt1hiUKwnGvl9etHnvLJ0YQT-8sQ",
  authDomain: "convidados-ellen-db.firebaseapp.com",
  projectId: "convidados-ellen-db",
  storageBucket: "convidados-ellen-db.appspot.com",
  messagingSenderId: "180645652218",
  appId: "1:180645652218:web:eba86837646afb44cbcb43",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
// ==========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(cors());

// Rotas CRUD para convidados
app.get("/convidados", async (req, res) => {
  try {
    const convidadosRef = ref(db, "convidados");
    const convidadosSnapshot = await get(convidadosRef);
    if (convidadosSnapshot.exists()) {
      const convidados = convidadosSnapshot.val();
      res.json(Object.values(convidados));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Erro ao buscar convidados:", error);
    res.status(500).json({ message: "Erro ao buscar convidados" });
  }
});

app.get("/convidados/:id", async (req, res) => {
  const { id } = req.params;
  const convidadoRef = ref(db, `convidados/${id}`);
  const convidadoSnapshot = await get(convidadoRef);

  if (convidadoSnapshot.exists()) {
    const convidado = convidadoSnapshot.val();
    res.json(convidado);
  } else {
    res.status(404).json({ message: "Convidado não encontrado" });
  }
});

app.post("/convidados", async (req, res) => {
  const { nome, confirmado, dataCriacao, dataValidacao } = req.body;

  if (!nome || typeof confirmado !== "boolean") {
    return res
      .status(400)
      .json({ message: "Nome e confirmado são campos obrigatórios" });
  }

  const id = uuidv4();
  const convidadoRef = ref(db, `convidados/${id}`);

  try {
    await set(convidadoRef, {
      id,
      nome,
      confirmado,
      dataCriacao,
      dataValidacao,
    });
    res.status(201).json({ id, nome, confirmado, dataCriacao, dataValidacao });
  } catch (error) {
    console.error("Erro ao criar convidado:", error);
    res.status(500).json({ message: "Erro ao criar convidado" });
  }
});

app.put("/convidados/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, confirmado, dataValidacao } = req.body;

  const convidadoRef = ref(db, `convidados/${id}`);
  const convidadoSnapshot = await get(convidadoRef);

  if (convidadoSnapshot.exists()) {
    try {
      await update(convidadoRef, { nome, confirmado, dataValidacao });
      res.json({ id, nome, confirmado, dataValidacao });
    } catch (error) {
      console.error("Erro ao atualizar convidado:", error);
      res.status(500).json({ message: "Erro ao atualizar convidado" });
    }
  } else {
    res.status(404).json({ message: "Convidado não encontrado" });
  }
});

function formatString(inputString: string) {
  // Substitui hífens por espaços
  const stringWithSpaces = inputString.replace(/-/g, " ");

  // Remove acentos
  const stringWithoutAccents = stringWithSpaces
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return stringWithoutAccents.toLowerCase();
}

app.put("/confirmar-convidado", async (req, res) => {
  const { nome, dataValidacao } = req.body;

  if (!nome) {
    return res.status(400).json({ message: "Nome é um campo obrigatório" });
  }

  try {
    const convidadosRef = ref(db, "convidados");
    const convidadosSnapshot = await get(convidadosRef);

    if (convidadosSnapshot.exists()) {
      const convidados = convidadosSnapshot.val();
      const convidadoId = Object.keys(convidados).find(
        (key) => formatString(convidados[key].nome) === formatString(nome)
      );

      if (convidadoId) {
        const convidadoRef = ref(db, `convidados/${convidadoId}`);
        const convidadoSnapshot = await get(convidadoRef);

        if (convidadoSnapshot.exists()) {
          const convidado = convidadoSnapshot.val();

          if (!convidado.confirmado) {
            await update(convidadoRef, { confirmado: true, dataValidacao });
            res.json({
              user: convidado,
              message: "Convidado confirmado com sucesso",
            });
          } else {
            res.json({ user: convidado, message: "Convidado já confirmado" });
          }
        } else {
          res.status(404).json({ message: "Convidado não encontrado" });
        }
      } else {
        res.status(404).json({ message: "Convidado não encontrado" });
      }
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Erro ao confirmar convidado:", error);
    res.status(500).json({ message: "Erro ao confirmar convidado" });
  }
});

app.delete("/convidados/all", async (req, res) => {
  const convidadosRef = ref(db, "convidados");

  try {
    // Define o valor de "convidados" como um objeto vazio para excluir todos os convidados
    await set(convidadosRef, {});

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir todos os convidados:", error);
    res.status(500).json({ message: "Erro ao excluir todos os convidados" });
  }
});

app.delete("/convidados/:id", async (req, res) => {
  const { id } = req.params;
  const convidadoRef = ref(db, `convidados/${id}`);

  try {
    const convidadoSnapshot = await get(convidadoRef);

    if (convidadoSnapshot.exists()) {
      await remove(convidadoRef);
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Convidado não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao excluir convidado:", error);
    res.status(500).json({ message: "Erro ao excluir convidado" });
  }
});

// ==================================================================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
