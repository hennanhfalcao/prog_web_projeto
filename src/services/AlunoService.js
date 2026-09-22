const prisma = require("../databases/prisma");
const AlunoInvalidoError = require("../errors/AlunoInvalidoError");
const AlunoNaoEncontradoError = require("../errors/AlunoNaoEncontradoError");
const EmailDuplicadoError = require("../errors/EmailDuplicadoError");

class AlunoService{

    async findMany(page, pageSize, orderBy, order){
        const direcao = (order === "asc" || order === "desc") ? order : "asc";

        const [alunos, total] = await Promise.all([
            prisma.aluno.findMany({
                skip: (page-1)*pageSize,
                take: Number(pageSize),
                orderBy: { [orderBy]: direcao }
            }),
            prisma.aluno.count()
        ]);

        return { alunos, total };
    }

    async findUnique(id){
        const aluno = await prisma.aluno.findUnique({
            where: { id: Number(id) }
        });

        if(!aluno){
            throw new AlunoNaoEncontradoError();
        }

        return aluno;
    }

    async update(id, dados){
        const { nome, email } = dados;

        // Reaproveita AlunoInvalidoError,
        // só muda o texto pra se adequar ao contexto.
        if(!nome && !email){
            throw new AlunoInvalidoError("Informe nome e/ou email para atualizar o aluno");
        }

        // Garante que o aluno existe antes de tentar atualizar,
        //  caso não exista, lança AlunoNaoEncontradoError.
        await this.findUnique(id);

        try{
            const aluno = await prisma.aluno.update({
                where: { id: Number(id) },
                data: { nome, email }
            });
            return aluno;
        }catch(error){
            // P2002 = violação de constraint @unique quando um email já é usado por outro aluno
            if(error.code === "P2002"){
                throw new EmailDuplicadoError();
            }
            throw error;
        }
    }

    async delete(id){
        await this.findUnique(id);

        await prisma.aluno.delete({
            where: { id: Number(id) }
        });
    }

    async create(aluno){
        const {nome, email} = aluno;
        if(!nome || !email){
            throw new AlunoInvalidoError();
        }

        const novoAluno = await prisma.aluno.create({data: aluno});

        return novoAluno;
    }
}

module.exports = new AlunoService();