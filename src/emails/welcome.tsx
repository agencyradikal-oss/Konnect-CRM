import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function WelcomeEmail({
  name,
  appUrl,
}: {
  name?: string | null;
  appUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a Konnect — directorio + CRM para Atlanta</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            ¡Bienvenido{name ? `, ${name}` : ""}!
          </Heading>
          <Text style={text}>
            Tu cuenta en Konnect ya está lista. Registra tu negocio gratis y
            empieza a recibir leads desde el directorio.
          </Text>
          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button href={`${appUrl}/registrar-empresa`} style={button}>
              Registrar mi negocio
            </Button>
          </Section>
          <Text style={muted}>Konnect™ · KMD Agency · Atlanta metro</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f0f5f4",
  fontFamily: "system-ui,sans-serif",
};
const container = {
  backgroundColor: "#ffffff",
  margin: "24px auto",
  padding: "32px",
  borderRadius: "12px",
  maxWidth: "520px",
};
const h1 = { color: "#0e1b1a", fontSize: "22px" };
const text = { color: "#0e1b1a", fontSize: "15px", lineHeight: "1.5" };
const muted = { color: "#5c6b69", fontSize: "12px" };
const button = {
  backgroundColor: "#31C9C0",
  color: "#06302d",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 600,
  textDecoration: "none",
};
