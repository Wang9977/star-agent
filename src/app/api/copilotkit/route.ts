import { handleWithGuard } from "./handler";

export async function POST(request: Request) {
  return handleWithGuard(request);
}

export async function GET(request: Request) {
  return handleWithGuard(request);
}