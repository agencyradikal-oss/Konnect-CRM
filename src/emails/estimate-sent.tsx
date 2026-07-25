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

export function EstimateSentEmail({
  businessName,
  estimateNumber,
  totalLabel,
  publicUrl,
  clientName,
}: {
  businessName: string;
  estimateNumber: number;
  totalLabel: string;
  publicUrl: string;
  clientName?: string | null;
}) {
  const greeting = clientName?.trim()
    ? `Hola ${clientName.trim()},`
    : "Hola,";

  return (
    <Html>
      <Head />
      <Preview>
        {`Presupuesto #${estimateNumber} de ${businessName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Tu presupuesto</Heading>
          <Text style={text}>
            {greeting}
            <br />
            <strong>{businessName}</strong> te envió el presupuesto #
            {String(estimateNumber)} por {totalLabel}.
          </Text>
          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button href={publicUrl} style={button}>
              Ver y aceptar presupuesto
            </Button>
          </Section>
          <Text style={muted}>
            Puedes revisar el detalle, aceptarlo o rechazarlo desde el enlace.
          </Text>
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
const muted = { color: "#5c6b69", fontSize: "13px" };
const button = {
  backgroundColor: "#31C9C0",
  color: "#06302d",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 600,
  textDecoration: "none",
};
