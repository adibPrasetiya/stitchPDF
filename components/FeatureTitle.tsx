interface FeatureTitleProps {
  title: string;
  description?: string;
}

export default function FeatureTitle({
  title,
  description,
}: FeatureTitleProps) {
  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: "32px",
        padding: "24px 20px",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#212529",
          marginBottom: "12px",
        }}
      >
        {title}
      </h1>
      {description && (
        <p
          style={{
            fontSize: "16px",
            color: "#6c757d",
            margin: 0,
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
