import Link from 'next/link';
import ThemeReset from '@/components/ThemeReset';
import { CookieSettingsLink } from '@/components/CookieConsent';

export const metadata = {
  title: 'Política de Privacidade · BrasaBurg & Freeze',
  description: 'Como a BrasaBurg & Freeze coleta, usa e protege os seus dados pessoais, conforme a LGPD.',
};

const SITE = 'https://brasaburg-freeze.vercel.app';

const SECTIONS = [
  ['introducao', 'Introdução'],
  ['dados', 'Dados pessoais coletados'],
  ['finalidades', 'Finalidades do tratamento'],
  ['meta', 'Integrações com a Meta'],
  ['compartilhamento', 'Compartilhamento de informações'],
  ['seguranca', 'Armazenamento e segurança'],
  ['conservacao', 'Prazo de conservação'],
  ['direitos', 'Direitos dos titulares'],
  ['cookies', 'Cookies e armazenamento local'],
  ['criancas', 'Crianças e adolescentes'],
  ['alteracoes', 'Alterações nesta política'],
  ['contato', 'Contato'],
];

function Section({ n, children }) {
  const [id, title] = SECTIONS[n - 1];
  return (
    <section id={id} className="legal-section">
      <h2>
        <span>{String(n).padStart(2, '0')}</span> {title}
      </h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <ThemeReset />
      <header className="legal-head">
        <p className="kicker">Transparência e LGPD</p>
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Última atualização: 21 de outubro de 2026</p>
      </header>

      <div className="legal-layout">
        <nav className="legal-toc" aria-label="Seções da política">
          <p>Nesta página</p>
          <ol>
            {SECTIONS.map(([id, title]) => (
              <li key={id}>
                <a href={`#${id}`}>{title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal-body">
          <Section n={1}>
            <p>
              A <strong>BrasaBurg &amp; Freeze</strong> respeita a privacidade e a proteção dos dados pessoais de seus
              clientes e visitantes.
            </p>
            <p>
              Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos, compartilhamos e protegemos
              as informações pessoais fornecidas por meio do nosso site, cardápio digital, sistema de pedidos e
              eventuais integrações com plataformas de terceiros.
            </p>
            <p>
              O tratamento de dados pessoais observa a Lei Geral de Proteção de Dados Pessoais (LGPD), Lei nº
              13.709/2018, e as demais normas aplicáveis.
            </p>
          </Section>

          <Section n={2}>
            <p>Dependendo dos serviços utilizados, poderemos coletar:</p>
            <ul>
              <li>Nome do cliente;</li>
              <li>Número de telefone e WhatsApp;</li>
              <li>Endereço de entrega, quando necessário;</li>
              <li>Informações dos produtos solicitados;</li>
              <li>Histórico e status dos pedidos;</li>
              <li>Informações necessárias à confirmação de pagamento;</li>
              <li>Informações técnicas de acesso, como endereço IP, navegador e dispositivo;</li>
              <li>Informações fornecidas voluntariamente em mensagens e formulários.</li>
            </ul>
            <p>
              Caso sejam utilizadas integrações com WhatsApp, Instagram ou Facebook, poderemos tratar informações
              disponibilizadas pelo usuário e autorizadas pelas respectivas plataformas, limitadas às funcionalidades
              efetivamente implementadas.
            </p>
            <p className="legal-note">
              Não solicitamos senhas de redes sociais nem dados completos de cartões bancários por meio do nosso
              sistema de pedidos.
            </p>
          </Section>

          <Section n={3}>
            <p>Os dados pessoais poderão ser utilizados para:</p>
            <ol>
              <li>Registrar, processar e acompanhar pedidos;</li>
              <li>Identificar clientes e permitir a comunicação relacionada às compras;</li>
              <li>Confirmar pagamentos e organizar entregas ou retiradas;</li>
              <li>Prestar atendimento e responder solicitações;</li>
              <li>Administrar o funcionamento e a segurança do sistema;</li>
              <li>Prevenir fraudes e acessos não autorizados;</li>
              <li>Cumprir obrigações legais;</li>
              <li>Enviar comunicações promocionais, quando houver fundamento legal adequado.</li>
            </ol>
            <p>
              Os dados são tratados com base nas hipóteses legais aplicáveis, incluindo execução de contrato,
              cumprimento de obrigação legal, legítimo interesse quando cabível e consentimento quando necessário.
            </p>
          </Section>

          <Section n={4}>
            <p>
              A BrasaBurg &amp; Freeze poderá utilizar serviços disponibilizados pela Meta Platforms, incluindo
              Facebook, Instagram e WhatsApp, para atendimento, comunicação e integração de funcionalidades.
            </p>
            <p>
              Quando essas integrações estiverem habilitadas, o tratamento de informações respeitará as permissões
              concedidas, as políticas das plataformas e a legislação aplicável.
            </p>
            <p className="legal-note">A BrasaBurg &amp; Freeze não vende dados pessoais obtidos por meio dessas integrações.</p>
          </Section>

          <Section n={5}>
            <p>
              Poderemos compartilhar informações estritamente necessárias com prestadores de serviços responsáveis por
              hospedagem, infraestrutura, armazenamento, processamento de pagamentos, comunicação e operação dos
              pedidos. Entre os serviços que poderão ser utilizados estão:
            </p>
            <ul>
              <li>
                <strong>Neon</strong>, para infraestrutura e banco de dados;
              </li>
              <li>
                <strong>Vercel</strong>, para hospedagem do site;
              </li>
              <li>
                <strong>Meta</strong>, para integrações com suas plataformas;
              </li>
              <li>
                <strong>Provedores de pagamento</strong>, quando contratados.
              </li>
            </ul>
            <p>
              O compartilhamento é limitado às finalidades informadas nesta política e às operações efetivamente
              realizadas.
            </p>
          </Section>

          <Section n={6}>
            <p>
              Adotamos medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não
              autorizados, perda, alteração, divulgação indevida e outras formas de tratamento irregular.
            </p>
            <p>
              Essas medidas incluem autenticação de administradores, controle de permissões, conexões criptografadas e
              restrições de acesso ao banco de dados.
            </p>
            <p>
              Nenhum sistema digital é completamente imune a riscos, mas buscamos reduzir as possibilidades de
              incidentes de segurança.
            </p>
          </Section>

          <Section n={7}>
            <p>
              Os dados pessoais são mantidos pelo período necessário ao cumprimento das finalidades descritas nesta
              política, respeitando as obrigações legais e regulatórias aplicáveis.
            </p>
            <p>
              Após esse período, os dados são eliminados ou anonimizados, salvo quando houver fundamento legal para sua
              conservação.
            </p>
          </Section>

          <Section n={8}>
            <p>Nos termos da LGPD, você pode solicitar, conforme aplicável:</p>
            <ul>
              <li>Confirmação da existência de tratamento;</li>
              <li>Acesso aos dados pessoais;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Anonimização, bloqueio ou eliminação de dados nas hipóteses legais;</li>
              <li>Informações sobre compartilhamento de dados;</li>
              <li>Revogação do consentimento, quando aplicável;</li>
              <li>Outros direitos previstos na legislação.</li>
            </ul>
            <p>
              As solicitações podem ser encaminhadas pelo canal indicado na seção{' '}
              <a href="#contato">Contato</a>.
            </p>
          </Section>

          <Section n={9}>
            <p>
              O site utiliza tecnologias de armazenamento local para manter temporariamente informações do carrinho,
              preferências de navegação e dados necessários ao funcionamento da aplicação. Hoje usamos apenas itens
              essenciais:
            </p>
            <div className="legal-table-wrap">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Para que serve</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Carrinho de compras</td>
                    <td>Guarda neste aparelho os itens escolhidos e o seu nome e WhatsApp, para agilizar o pedido.</td>
                    <td>Essencial (armazenamento local)</td>
                  </tr>
                  <tr>
                    <td>Preferência de cookies</td>
                    <td>Lembra se você aceitou ou recusou cookies não essenciais.</td>
                    <td>Essencial (armazenamento local)</td>
                  </tr>
                  <tr>
                    <td>Acesso da cozinha</td>
                    <td>Mantém a equipe conectada ao painel interno de pedidos. Não é usado por clientes.</td>
                    <td>Essencial (cookie)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Caso sejam implementados cookies analíticos, publicitários ou outras tecnologias não essenciais, esta
              política será atualizada e eles só serão ativados com o seu consentimento. Você pode mudar sua escolha a
              qualquer momento em <CookieSettingsLink />.
            </p>
          </Section>

          <Section n={10}>
            <p>
              O tratamento de dados pessoais de crianças e adolescentes observa a legislação aplicável e o seu melhor
              interesse. Buscamos limitar a coleta de informações ao necessário para o atendimento e a execução dos
              serviços.
            </p>
          </Section>

          <Section n={11}>
            <p>
              Esta Política de Privacidade pode ser atualizada para refletir alterações nos serviços, nas tecnologias
              utilizadas ou na legislação. A versão atualizada fica disponível nesta página, com a respectiva data de
              revisão.
            </p>
          </Section>

          <Section n={12}>
            <p>
              Para dúvidas sobre privacidade, tratamento de dados pessoais ou exercício dos direitos previstos na LGPD,
              fale com a gente:
            </p>
            <dl className="legal-contact">
              <dt>Marca</dt>
              <dd>BrasaBurg &amp; Freeze</dd>
              <dt>Instagram</dt>
              <dd>
                <a href="https://instagram.com/brasafreeze" target="_blank" rel="noreferrer">
                  @brasafreeze
                </a>
              </dd>
              <dt>Site</dt>
              <dd>
                <a href={SITE}>{SITE.replace('https://', '')}</a>
              </dd>
            </dl>
          </Section>

          <p className="legal-copy">© 2026 BrasaBurg &amp; Freeze. Todos os direitos reservados.</p>
          <Link href="/" className="btn btn-ghost">
            Voltar para o início
          </Link>
        </article>
      </div>
    </div>
  );
}
