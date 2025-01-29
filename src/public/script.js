const textarea = document.querySelector("textarea");
const button = document.querySelector("button");
const output = document.getElementById("result");

async function main() {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "text/plain");
  try {
    const res = await fetch("/api/new", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ url: textarea.value }),
    });
    const content = res.ok ? await res.text() : (await res.json()).message
    output.textContent = content
    console.log(content)
  } catch (err) {
    alert("Error: " + err);
    console.error(err);
  }
}

button.addEventListener("click", async () => {
  await main();
});

document.addEventListener("keydown", async (e) => {
  e = e || window.event || event;
  if (e.ctrlKey && e.key === "Enter") {
    e.preventDefault();
    await main();
  }
});
