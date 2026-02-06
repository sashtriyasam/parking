import { authService } from '@/services/auth.service';

export default function TestAuth() {
    console.log("Auth Service:", authService);
    return (
        <div className="p-10 bg-purple-100 text-purple-900 border-4 border-purple-500">
            <h1 className="text-3xl font-bold">Auth Service Loaded!</h1>
        </div>
    );
}
