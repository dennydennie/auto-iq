export class AppService {
  getApiInfo() {
    return {
      service: "auto-iq-api",
      version: "0.1.0",
      status: "bootstrapped",
    };
  }
}
