import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="pt-BR">
            <Head>
                <link
                    rel="icon"
                    type="image/png"
                    href="/elmo-icon.png"
                />
                <title>Tribo TV</title>
                <meta name="description" content="Player da Tribo com analytics em tempo real." />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
