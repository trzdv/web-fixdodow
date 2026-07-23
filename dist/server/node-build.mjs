import path from "node:path";
import "dotenv/config";
import * as express$1 from "express";
import express from "express";
import cors from "cors";
import { promises } from "fs";
import path$1 from "path";
//#region server/routes/demo.ts
var handleDemo = (req, res) => {
	res.status(200).json({ message: "Hello from Express server" });
};
//#endregion
//#region client/lib/data.ts
var defaultSiteData = {
	title: "✨ Dashboard 💌",
	subtitle: "Description of the dashboard",
	introParagraph: "˚ ༘ ⋆｡ ˚ ୨୧ ⋆ ˚｡⋆˚",
	categories: [],
	ads: [],
	theme: {
		primaryColor: "#e93faa",
		secondaryColor: "#1a1a1a",
		backgroundColor: "#ffffff",
		textColor: "#1a1a1a",
		accentColor: "#e93faa"
	}
};
//#endregion
//#region client/lib/auth.ts
var hashPassword = (password) => {
	let hash = 0;
	for (let i = 0; i < password.length; i++) {
		const char = password.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
};
var defaultUsers = [{
	id: "1",
	username: "dodow",
	password: hashPassword("deadodow12"),
	role: "admin",
	createdAt: (/* @__PURE__ */ new Date()).toISOString()
}];
//#endregion
//#region server/routes/admin.ts
var defaultAdminData = () => ({
	siteData: defaultSiteData,
	users: defaultUsers
});
function createAdminDataStore(filePath = path$1.resolve(process.cwd(), "data", "admin-data.json")) {
	const resolvedPath = filePath;
	const ensureDirectory = async () => {
		await promises.mkdir(path$1.dirname(resolvedPath), { recursive: true });
	};
	const load = async () => {
		try {
			await ensureDirectory();
			const raw = await promises.readFile(resolvedPath, "utf8");
			const parsed = JSON.parse(raw);
			return {
				siteData: parsed?.siteData ?? defaultSiteData,
				users: Array.isArray(parsed?.users) && parsed.users.length > 0 ? parsed.users : defaultUsers
			};
		} catch {
			await save(defaultAdminData());
			return defaultAdminData();
		}
	};
	const save = async (data) => {
		await ensureDirectory();
		await promises.writeFile(resolvedPath, JSON.stringify(data, null, 2), "utf8");
	};
	return {
		load,
		save
	};
}
//#endregion
//#region server/index.ts
function createServer() {
	const app = express();
	const adminStore = createAdminDataStore();
	app.use(cors());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.get("/api/ping", (_req, res) => {
		const ping = process.env.PING_MESSAGE ?? "ping";
		res.json({ message: ping });
	});
	app.get("/api/demo", handleDemo);
	app.get("/api/admin/data", async (_req, res) => {
		try {
			const data = await adminStore.load();
			res.json(data);
		} catch (error) {
			res.status(500).json({ message: "Failed to load admin data" });
		}
	});
	app.put("/api/admin/data", async (req, res) => {
		try {
			await adminStore.save(req.body);
			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ message: "Failed to save admin data" });
		}
	});
	return app;
}
//#endregion
//#region server/node-build.ts
var app = createServer();
var port = process.env.PORT || 3e3;
var __dirname = import.meta.dirname;
var distPath = path.join(__dirname, "../spa");
app.use(express$1.static(distPath));
app.get("*", (req, res) => {
	if (req.path.startsWith("/api/") || req.path.startsWith("/health")) return res.status(404).json({ error: "API endpoint not found" });
	res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
	console.log(`🚀 Fusion Starter server running on port ${port}`);
	console.log(`📱 Frontend: http://localhost:${port}`);
	console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
	console.log("🛑 Received SIGTERM, shutting down gracefully");
	process.exit(0);
});
process.on("SIGINT", () => {
	console.log("🛑 Received SIGINT, shutting down gracefully");
	process.exit(0);
});
//#endregion
export {};

//# sourceMappingURL=node-build.mjs.map