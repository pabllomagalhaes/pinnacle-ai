[INÍCIO DO CHECKPOINT DO PROJETO]
Assuma o papel de Engenheiro de Software Parceiro. Estamos construindo o PinnacleAI, um SaaS voltado para gestão de estudos, controle de tempo, produtividade e métricas de alto rendimento.

Stack Tecnológico:

    Next.js (App Router) + TypeScript + Tailwind CSS.

    Banco de Dados e Autenticação: Supabase (com OAuth do Google).

Estado Atual do Sistema (O que já está pronto):

    Repositório Git configurado e sincronizado. Variáveis de ambiente (.env.local) seguras e chaves rotacionadas.

    A rota /login está renderizando corretamente e configurada para chamar o Supabase.

    A rota /auth/callback/route.ts está operando e redirecionando o fluxo do Google com sucesso para o /dashboard.

Diretrizes Rigorosas:

    Este é um produto de produtividade em nível comercial. Mantenha o código limpo, escalável e modular.

    ATENÇÃO: Isole completamente este contexto. Este projeto NÃO tem nenhuma relação com os meus projetos acadêmicos (como o app de matemática escolar). Foco estrito em gestão de tempo e métricas.

Sua Tarefa Agora:
Leia este estado, confirme que você assimilou o contexto respondendo apenas com "PinnacleAI carregado e isolado. Qual é o alvo de hoje, Pablo?" e aguarde minha próxima instrução.
[FIM DO CHECKPOINT]


------------------

O que já foi construído (A Fundação)

A fundação do ecossistema está pronta, segura e seguindo as melhores práticas de arquitetura de software:

    Ambiente de Desenvolvimento: Projeto Next.js (App Router) configurado com TypeScript e Tailwind CSS, rodando de forma limpa.

    Versionamento e Segurança: Repositório sincronizado no GitHub. O arquivo .gitignore está protegendo as credenciais, as variáveis de ambiente (.env.local) foram centralizadas na raiz e as chaves de API do Supabase foram rotacionadas para garantir a segurança absoluta do banco de dados.

    Mecanismo de Autenticação (OAuth Google):

        Configuração de credenciais concluída entre o Google Cloud Console e o Supabase.

        Criação da tela de login principal (app/login/page.tsx) com o acionador para autenticação do Google.

        Criação da rota de escuta (app/auth/callback/route.ts), responsável por capturar o código do Google, validar a sessão no Supabase e direcionar o usuário para o ambiente interno.

    Página Interna Base: Estrutura inicial da pasta /dashboard criada para receber o usuário autenticado.

🚀 O que temos a construir (O Produto)

Agora que a engenharia de infraestrutura básica terminou, entramos na fase de modelagem das regras de negócio, controle de tempo e métricas de rendimento. O roteiro de desenvolvimento está dividido em três grandes pilares:
1. Interface e Layout Profissional (Front-end)

    Instalação do shadcn/ui: Incorporar a biblioteca de componentes para criar uma interface padrão SaaS, limpa e moderna.

    Sidebar de Navegação: Criar um menu lateral persistente para transitar entre o Painel Principal, Histórico de Foco, Calendário e Relatórios.

    Cards de Métricas: Desenhar os blocos visuais que exibirão o tempo total de estudo, metas do dia e nível de rendimento.

2. O Motor de Produtividade (Integrações e Lógica)

    Integração com Google Calendar API: Conectar a agenda do Google para ler seus compromissos e permitir que o PinnacleAI liste cronogramas de estudo diretamente na interface.

    Cronômetro de Foco / Pomodoro: Desenvolver a lógica em TypeScript para contagem de tempo focado, pausas e registro de sessões de estudo.

    Validação de Sessão: Proteger as rotas do /dashboard para garantir que apenas usuários realmente logados pelo Google consigam acessar as ferramentas.

3. Persistência de Dados e Gráficos (Back-end e Analytics)

    Modelagem do Banco de Dados (Supabase): Criar tabelas para salvar o histórico de cada sessão de estudo realizada (tempo gasto, matéria estudada, data e nível de satisfação/rendimento).

    Painel de Analytics: Consumir os dados salvos no Supabase e transformá-los em gráficos visuais (horas estudadas por semana, evolução da produtividade e taxas de conclusão de metas).

    Dito isto, aqui está o nosso "Radar de APIs" que você pode manter em mente para as próximas sprints, mas que recomendo deixarmos desativadas por enquanto:

1. Google People API

    Para que serve: Lê o perfil público completo do utilizador.

    Onde usaríamos: Para substituir aquele "Bem-vindo, email@gmail.com" no topo da sua Dashboard pelo seu Nome real e puxar a sua foto de perfil do Google para criar um Avatar redondo bem profissional no canto da tela.

2. Gmail API

    Para que serve: Permite ler, enviar e modificar e-mails.

    Onde usaríamos: Uma funcionalidade premium onde o utilizador pode "Transformar um e-mail numa Tarefa", ou para o próprio PinnacleAI enviar-lhe um e-mail automático às segundas-feiras de manhã com o resumo de quantas horas de foco você teve na semana anterior.

3. Google Drive API

    Para que serve: Acesso aos ficheiros da nuvem.

    Onde usaríamos: Se no futuro você quiser adicionar a funcionalidade de anexar documentos (como PDFs ou planilhas de requisitos) diretamente às suas Metas no painel.