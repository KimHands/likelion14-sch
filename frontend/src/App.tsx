import { useEffect, useState } from "react";

function App() {
  const [result, setResult] = useState<string>("loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((res) => res.text())
      .then((text) => {
        setResult(text.slice(0, 200));
      })
      .catch((err: Error) => {
        setResult("ERROR: " + err.message);
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>React ↔ Django 연결 테스트 (TS)</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
    </div>
  );
}

export default App;