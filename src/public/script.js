const url = document.getElementById("url");
const generateCheckbox = document.getElementById("generateCheckbox");
const button = document.getElementById("shorten");
const output = document.getElementById("result");

async function main() {
	const headers = new Headers();
	headers.append("Content-Type", "application/json");
	headers.append("Accept", "text/plain");
	try {
		const res = await fetch("/api/new", {
			method: "POST",
			headers: headers,
			body: JSON.stringify({
				url: url.value,
				generate: generateCheckbox.checked,
			}),
		});
		const content = res.ok ? await res.text() : (await res.json()).message;
		output.textContent = content;
	} catch (err) {
		alert(`Error: ${err}`);
		console.error(err);
	}
}

button.addEventListener("click", async () => {
	await main();
});

document.addEventListener("keydown", async (e) => {
	if (e.ctrlKey && e.key === "Enter") {
		e.preventDefault();
		await main();
	}
});
