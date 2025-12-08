import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Inicio
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Politica de Privacidade
        </h1>
        <p className="text-muted-foreground mb-8">
          Ultima atualizacao: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introducao</h2>
            <p className="text-muted-foreground leading-relaxed">
              A UMP Emaus ("nos", "nosso" ou "Emaus") opera o aplicativo e site Emaus. 
              Esta pagina informa sobre nossas politicas relativas a coleta, uso e divulgacao 
              de informacoes pessoais quando voce usa nosso Servico.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Informacoes que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Coletamos varios tipos de informacoes para fornecer e melhorar nosso Servico:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Dados Pessoais:</strong> Nome, endereco de e-mail, numero de telefone e data de nascimento quando voce se cadastra como membro.</li>
              <li><strong>Dados de Uso:</strong> Informacoes sobre como voce acessa e usa o Servico, incluindo paginas visitadas e recursos utilizados.</li>
              <li><strong>Dados do Instagram:</strong> Quando integramos com o Instagram, acessamos apenas o conteudo publico da conta vinculada para exibir posts no site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Como Usamos Suas Informacoes</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Usamos as informacoes coletadas para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer e manter nosso Servico</li>
              <li>Notificar sobre mudancas em nosso Servico</li>
              <li>Permitir participacao em recursos interativos</li>
              <li>Fornecer suporte ao cliente</li>
              <li>Enviar notificacoes sobre eventos, devocionais e atualizacoes</li>
              <li>Monitorar o uso do Servico</li>
              <li>Detectar e prevenir problemas tecnicos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nao vendemos, comercializamos ou transferimos suas informacoes pessoais para terceiros. 
              Suas informacoes sao usadas exclusivamente para os fins descritos nesta politica e 
              para o funcionamento do Servico da UMP Emaus.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Seguranca dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              A seguranca dos seus dados e importante para nos. Utilizamos medidas de seguranca 
              apropriadas para proteger suas informacoes pessoais contra acesso nao autorizado, 
              alteracao, divulgacao ou destruicao. No entanto, nenhum metodo de transmissao pela 
              Internet ou armazenamento eletronico e 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Integracao com Instagram</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nosso aplicativo utiliza a API do Instagram para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Exibir publicacoes publicas da conta oficial da UMP Emaus</li>
              <li>Sincronizar conteudo de midia (fotos e videos) para o site</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Nao coletamos ou armazenamos dados pessoais de seguidores ou usuarios do Instagram 
              alem do conteudo publico da nossa propria conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Voce tem o direito de:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Acessar as informacoes pessoais que temos sobre voce</li>
              <li>Solicitar a correcao de informacoes incorretas</li>
              <li>Solicitar a exclusao de suas informacoes pessoais</li>
              <li>Retirar seu consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para manter sua sessao ativa, 
              lembrar suas preferencias e melhorar sua experiencia no Servico.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Alteracoes nesta Politica</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar nossa Politica de Privacidade periodicamente. Notificaremos 
              sobre quaisquer alteracoes publicando a nova Politica de Privacidade nesta pagina 
              e atualizando a data de "Ultima atualizacao".
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se voce tiver alguma duvida sobre esta Politica de Privacidade, entre em contato conosco:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
              <li><strong>E-mail:</strong> marketingumpemaus@gmail.com</li>
              <li><strong>Instagram:</strong> @umpemaus</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            UMP Emaus - Uniao de Mocidade Presbiteriana
          </p>
        </div>
      </main>
    </div>
  );
}
