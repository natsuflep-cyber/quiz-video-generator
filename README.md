# 🎬 Quiz Video Generator

Gera vídeos verticais (9:16, 1080×1920) de quiz — com contagem regressiva,
tic-tac e narração em português do Brasil — direto no navegador, prontos
para baixar e postar no TikTok.

## Como funciona (arquitetura escolhida e por quê)

Rodar o **ffmpeg tradicional dentro de uma Serverless Function da Vercel**
é frágil na prática: o binário é pesado (~70 MB, perto do limite de tamanho
de função), o tempo de execução é limitado (10–60 s conforme o plano) e o
sistema de arquivos é somente leitura fora de `/tmp`. Por isso, este projeto
usa uma abordagem 100% compatível com o plano gratuito da Vercel:

1. **Desenho do vídeo:** um `<canvas>` de 1080×1920 desenha cada quadro
   (pergunta, opções, contagem regressiva, revelação) com `requestAnimationFrame`.
2. **Narração:** uma API Route (`/app/api/tts/route.ts`, Node.js runtime)
   usa o pacote `msedge-tts` (gratuito, sem necessidade de chave de API) para
   sintetizar a voz `pt-BR-FranciscaNeural` e devolve um MP3 real.
3. **Tic-tac:** sintetizado ao vivo com a Web Audio API (osciladores), sem
   depender de nenhum arquivo de som externo.
4. **Gravação final:** `canvas.captureStream()` (vídeo) é combinado com a
   trilha de áudio (narração + tic-tac) num único `MediaStream`, gravado
   com `MediaRecorder` — que já entrega o contêiner final (MP4 quando o
   navegador suporta H.264, com fallback automático para WebM). **Nenhum
   ffmpeg é necessário.**

Se a chamada à API de narração falhar (ex.: sem internet no ambiente de
build/preview), o app não quebra: ele estima a duração da fala pelo número
de palavras e gera o vídeo mudo, apenas com o tic-tac.

### Limitações conhecidas

- A geração acontece em tempo real no navegador (o vídeo demora
  aproximadamente o mesmo tempo que sua duração final, ~12–15 s).
- MP4 gravado por `MediaRecorder` funciona melhor em Chrome/Edge
  atualizados; em navegadores sem suporte a `video/mp4;codecs=avc1`, o
  arquivo baixa como `.webm` (o app detecta isso e ajusta o nome/extensão
  do arquivo automaticamente).
- O pacote `msedge-tts` usa um serviço não-oficial da Microsoft. Se ele
  parar de funcionar, troque facilmente por Azure TTS ou ElevenLabs em
  `app/api/tts/route.ts` — a interface (recebe texto, devolve áudio) é a
  mesma.

## Estrutura do projeto

```
quiz-video-generator/
├── app/
│   ├── api/tts/route.ts     # Serverless function: texto → áudio MP3 (pt-BR)
│   ├── layout.tsx           # Layout raiz + fontes
│   ├── page.tsx             # Página principal (formulário + preview)
│   └── globals.css
├── components/
│   ├── QuizForm.tsx         # Formulário de pergunta/opções/resposta certa
│   └── PhonePreview.tsx     # Frame de celular 9:16 + player + botão de download
├── lib/
│   ├── types.ts
│   ├── audioEngine.ts       # Narração + tic-tac + escolha de mimeType
│   ├── canvasDraw.ts        # Desenho de cada quadro do vídeo
│   └── videoRenderer.ts     # Orquestra tudo e grava com MediaRecorder
├── package.json
└── tailwind.config.ts
```

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — preencha a pergunta, as duas opções e escolha
a resposta certa. A prévia no "celular" atualiza em tempo real; clique em
**🚀 GERAR VÍDEO DO QUIZ** para renderizar e depois em
**⬇️ BAIXAR VÍDEO** para salvar o arquivo.

## Deploy no GitHub + Vercel (passo a passo)

### 1. Suba o projeto para o GitHub

```bash
cd quiz-video-generator
git init
git add .
git commit -m "Quiz Video Generator inicial"
```

No GitHub, crie um repositório novo (vazio, sem README) e depois:

```bash
git remote add origin https://github.com/SEU-USUARIO/quiz-video-generator.git
git branch -M main
git push -u origin main
```

### 2. Importe na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub.
2. Clique em **Add New → Project**.
3. Selecione o repositório `quiz-video-generator` que você acabou de criar.
4. A Vercel detecta automaticamente que é um projeto **Next.js** — não é
   preciso alterar nenhuma configuração de build.
5. Clique em **Deploy**.

Em cerca de 1 minuto seu app estará no ar em uma URL do tipo
`https://quiz-video-generator.vercel.app`.

### 3. Atualizações futuras

Qualquer `git push` para a branch `main` gera automaticamente um novo
deploy na Vercel — não é preciso fazer nada manualmente depois da
configuração inicial.

## Personalizações rápidas

- **Trocar a voz da narração:** edite a constante `VOICE` em
  `app/api/tts/route.ts` (ex.: `pt-BR-AntonioNeural` para voz masculina).
- **Cores do vídeo:** ajuste os valores hexadecimais em `lib/canvasDraw.ts`
  (fundo amarelo, caixas azul/vermelha/verde).
- **Duração da contagem regressiva:** altere `countdownDuration` em
  `lib/videoRenderer.ts`.
