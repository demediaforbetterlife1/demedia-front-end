"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useI18n } from "@/contexts/I18nContext";
import { Eye, EyeOff, Mail, Lock, User, UserCheck, Phone } from "lucide-react";

/* ---------------- BACKGROUND 3D ---------------- */
function RotatingPlanet({
position,
size,
color,
}: {
position: [number, number, number];
size: number;
color: string;
}) {
const meshRef = useRef<THREE.Mesh | null>(null);
useFrame(() => {
try {
if (meshRef.current && meshRef.current.rotation) {
meshRef.current.rotation.y += 0.0015;
}
} catch (error) {
// Silently handle THREE.js context loss
}
});

return (  
    <mesh ref={meshRef} position={position}>  
        <sphereGeometry args={[size, 32, 32]} />  
        <meshStandardMaterial  
            color={color}  
            emissive={color}  
            emissiveIntensity={0.4}  
            roughness={0.6}  
            metalness={0.3}  
        />  
    </mesh>  
);

}

function ShootingStar() {
const meshRef = useRef<THREE.Mesh | null>(null);

useEffect(() => {  
    if (!meshRef.current || !meshRef.current.position) return;  

    const loop = () => {  
        try {
            if (meshRef.current && meshRef.current.position) {
                gsap.fromTo(  
                    meshRef.current.position,  
                    { x: -12, y: 6, z: -10 },  
                    {  
                        x: 10,  
                        y: -4,  
                        z: -6,  
                        duration: 2,  
                        ease: "power2.inOut",  
                        onComplete: loop,  
                    }  
                );
            }
        } catch (error) {
            // Silently handle THREE.js context loss
        }
    };  
    loop();  
}, []);  
return (  
    <mesh ref={meshRef}>  
        <sphereGeometry args={[0.12, 16, 16]} />  
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} />  
    </mesh>  
);

}

function Galaxy() {
const pointsRef = useRef<THREE.Points | null>(null);

useFrame((_, delta) => {  
    try {
        if (pointsRef.current && pointsRef.current.rotation) {  
            pointsRef.current.rotation.y += delta * 0.05;  
            pointsRef.current.rotation.x += delta * 0.01;  
        }
    } catch (error) {
        // Silently handle THREE.js context loss
    }
});  

const geometry = useMemo(() => {  
    const g = new THREE.BufferGeometry();  
    const vertices: number[] = [];  
    for (let i = 0; i < 2000; i++) {  
        const x = (Math.random() - 0.5) * 40;  
        const y = (Math.random() - 0.5) * 40;  
        const z = (Math.random() - 0.5) * 40;  
        vertices.push(x, y, z);  
    }  
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));  
    return g;  
}, []);  

return (  
    <points ref={pointsRef} geometry={geometry}>  
        <pointsMaterial size={0.05} color="#90caf9" />  
    </points>  
);

}

function SpaceBackground() {
return (
<div className="absolute inset-0 -z-10 bg-black">
<Canvas camera={{ position: [0, 0, 8], fov: 70 }}>
<ambientLight intensity={0.6} />
<pointLight position={[5, 5, 5]} intensity={1.5} color={"#bb86fc"} />
<Stars radius={150} depth={80} count={8000} factor={5} fade speed={2} />
<Galaxy />
<RotatingPlanet position={[2, -1, -7]} size={1.4} color={"#3f51b5"} />
<RotatingPlanet position={[-4, 2, -10]} size={0.9} color={"#ff9800"} />
<RotatingPlanet position={[5, 3, -12]} size={1.2} color={"#00bcd4"} />
<ShootingStar />
<OrbitControls enableZoom={false} />
</Canvas>
</div>
);
}
/* ----------------------------------------------- */
// Add this useEffect to your SignUpPage component


export default function SignUpPage() {
const [form, setForm] = useState({
name: "",
username: "",
phoneNumber: "",
email: "",
password: "",
});
const [selectedCountryCode, setSelectedCountryCode] = useState("+20");
const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email'); // Default to email

// Country codes data - Comprehensive list with Philippines and many more countries  
const countryCodes = [  
    // North America  
    { code: "+1", country: "US/Canada", flag: "🇺🇸" },  
    { code: "+52", country: "Mexico", flag: "🇲🇽" },  
      
    // Asia - East & Southeast  
    { code: "+86", country: "China", flag: "🇨🇳" },  
    { code: "+81", country: "Japan", flag: "🇯🇵" },  
    { code: "+82", country: "South Korea", flag: "🇰🇷" },  
    { code: "+63", country: "Philippines", flag: "🇵🇭" },  
    { code: "+65", country: "Singapore", flag: "🇸🇬" },  
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },  
    { code: "+66", country: "Thailand", flag: "🇹🇭" },  
    { code: "+84", country: "Vietnam", flag: "🇻🇳" },  
    { code: "+62", country: "Indonesia", flag: "🇮🇩" },  
    { code: "+855", country: "Cambodia", flag: "🇰🇭" },  
    { code: "+856", country: "Laos", flag: "🇱🇦" },  
    { code: "+95", country: "Myanmar", flag: "🇲🇲" },  
    { code: "+673", country: "Brunei", flag: "🇧🇳" },  
    { code: "+670", country: "East Timor", flag: "🇹🇱" },  
      
    // Asia - South  
    { code: "+91", country: "India", flag: "🇮🇳" },  
    { code: "+92", country: "Pakistan", flag: "🇵🇰" },  
    { code: "+880", country: "Bangladesh", flag: "🇧🇩" },  
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },  
    { code: "+977", country: "Nepal", flag: "🇳🇵" },  
    { code: "+975", country: "Bhutan", flag: "🇧🇹" },  
    { code: "+960", country: "Maldives", flag: "🇲🇻" },  
    { code: "+93", country: "Afghanistan", flag: "🇦🇫" },  
      
    // Asia - Central & West  
    { code: "+7", country: "Russia", flag: "🇷🇺" },  
    { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },  
    { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },  
    { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },  
    { code: "+992", country: "Tajikistan", flag: "🇹🇯" },  
    { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },  
    { code: "+90", country: "Turkey", flag: "🇹🇷" },  
    { code: "+98", country: "Iran", flag: "🇮🇷" },  
    { code: "+964", country: "Iraq", flag: "🇮🇶" },  
    { code: "+963", country: "Syria", flag: "🇸🇾" },  
    { code: "+961", country: "Lebanon", flag: "🇱🇧" },  
    { code: "+962", country: "Jordan", flag: "🇯🇴" },  
    { code: "+970", country: "Palestine", flag: "🇵🇸" },  
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },  
    { code: "+971", country: "UAE", flag: "🇦🇪" },  
    { code: "+974", country: "Qatar", flag: "🇶🇦" },  
    { code: "+973", country: "Bahrain", flag: "🇧🇭" },  
    { code: "+965", country: "Kuwait", flag: "🇰🇼" },  
    { code: "+968", country: "Oman", flag: "🇴🇲" },  
    { code: "+964", country: "Iraq", flag: "🇮🇶" },  
    { code: "+20", country: "Egypt", flag: "🇪🇬" },  
      
    // Europe  
    { code: "+44", country: "UK", flag: "🇬🇧" },  
    { code: "+33", country: "France", flag: "🇫🇷" },  
    { code: "+49", country: "Germany", flag: "🇩🇪" },  
    { code: "+39", country: "Italy", flag: "🇮🇹" },  
    { code: "+34", country: "Spain", flag: "🇪🇸" },  
    { code: "+7", country: "Russia", flag: "🇷🇺" },  
    { code: "+31", country: "Netherlands", flag: "🇳🇱" },  
    { code: "+32", country: "Belgium", flag: "🇧🇪" },  
    { code: "+41", country: "Switzerland", flag: "🇨🇭" },  
    { code: "+43", country: "Austria", flag: "🇦🇹" },  
    { code: "+45", country: "Denmark", flag: "🇩🇰" },  
    { code: "+46", country: "Sweden", flag: "🇸🇪" },  
    { code: "+47", country: "Norway", flag: "🇳🇴" },  
    { code: "+358", country: "Finland", flag: "🇫🇮" },  
    { code: "+48", country: "Poland", flag: "🇵🇱" },  
    { code: "+420", country: "Czech Republic", flag: "🇨🇿" },  
    { code: "+421", country: "Slovakia", flag: "🇸🇰" },  
    { code: "+36", country: "Hungary", flag: "🇭🇺" },  
    { code: "+40", country: "Romania", flag: "🇷🇴" },  
    { code: "+359", country: "Bulgaria", flag: "🇧🇬" },  
    { code: "+385", country: "Croatia", flag: "🇭🇷" },  
    { code: "+386", country: "Slovenia", flag: "🇸🇮" },  
    { code: "+30", country: "Greece", flag: "🇬🇷" },  
    { code: "+351", country: "Portugal", flag: "🇵🇹" },  
    { code: "+353", country: "Ireland", flag: "🇮🇪" },  
    { code: "+352", country: "Luxembourg", flag: "🇱🇺" },  
    { code: "+370", country: "Lithuania", flag: "🇱🇹" },  
    { code: "+371", country: "Latvia", flag: "🇱🇻" },  
    { code: "+372", country: "Estonia", flag: "🇪🇪" },  
    { code: "+356", country: "Malta", flag: "🇲🇹" },  
    { code: "+357", country: "Cyprus", flag: "🇨🇾" },  
    { code: "+380", country: "Ukraine", flag: "🇺🇦" },  
    { code: "+375", country: "Belarus", flag: "🇧🇾" },  
    { code: "+374", country: "Armenia", flag: "🇦🇲" },  
    { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },  
    { code: "+995", country: "Georgia", flag: "🇬🇪" },  
    { code: "+373", country: "Moldova", flag: "🇲🇩" },  
      
    // Africa  
    { code: "+27", country: "South Africa", flag: "🇿🇦" },  
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },  
    { code: "+254", country: "Kenya", flag: "🇰🇪" },  
    { code: "+251", country: "Ethiopia", flag: "🇪🇹" },  
    { code: "+20", country: "Egypt", flag: "🇪🇬" },  
    { code: "+212", country: "Morocco", flag: "🇲🇦" },  
    { code: "+213", country: "Algeria", flag: "🇩🇿" },  
    { code: "+216", country: "Tunisia", flag: "🇹🇳" },  
    { code: "+218", country: "Libya", flag: "🇱🇾" },  
    { code: "+249", country: "Sudan", flag: "🇸🇩" },  
    { code: "+220", country: "Gambia", flag: "🇬🇲" },  
    { code: "+221", country: "Senegal", flag: "🇸🇳" },  
    { code: "+223", country: "Mali", flag: "🇲🇱" },  
    { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },  
    { code: "+227", country: "Niger", flag: "🇳🇪" },  
    { code: "+228", country: "Togo", flag: "🇹🇬" },  
    { code: "+229", country: "Benin", flag: "🇧🇯" },  
    { code: "+230", country: "Mauritius", flag: "🇲🇺" },  
    { code: "+231", country: "Liberia", flag: "🇱🇷" },  
    { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },  
    { code: "+233", country: "Ghana", flag: "🇬🇭" },  
    { code: "+235", country: "Chad", flag: "🇹🇩" },  
    { code: "+236", country: "Central African Republic", flag: "🇨🇫" },  
    { code: "+237", country: "Cameroon", flag: "🇨🇲" },  
    { code: "+238", country: "Cape Verde", flag: "🇨🇻" },  
    { code: "+239", country: "São Tomé and Príncipe", flag: "🇸🇹" },  
    { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },  
    { code: "+241", country: "Gabon", flag: "🇬🇦" },  
    { code: "+242", country: "Republic of the Congo", flag: "🇨🇬" },  
    { code: "+243", country: "Democratic Republic of the Congo", flag: "🇨🇩" },  
    { code: "+244", country: "Angola", flag: "🇦🇴" },  
    { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },  
    { code: "+246", country: "British Indian Ocean Territory", flag: "🇮🇴" },  
    { code: "+248", country: "Seychelles", flag: "🇸🇨" },  
    { code: "+250", country: "Rwanda", flag: "🇷🇼" },  
    { code: "+252", country: "Somalia", flag: "🇸🇴" },  
    { code: "+253", country: "Djibouti", flag: "🇩🇯" },  
    { code: "+255", country: "Tanzania", flag: "🇹🇿" },  
    { code: "+256", country: "Uganda", flag: "🇺🇬" },  
    { code: "+257", country: "Burundi", flag: "🇧🇮" },  
    { code: "+258", country: "Mozambique", flag: "🇲🇿" },  
    { code: "+260", country: "Zambia", flag: "🇿🇲" },  
    { code: "+261", country: "Madagascar", flag: "🇲🇬" },  
    { code: "+262", country: "Réunion", flag: "🇷🇪" },  
    { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },  
    { code: "+264", country: "Namibia", flag: "🇳🇦" },  
    { code: "+265", country: "Malawi", flag: "🇲🇼" },  
    { code: "+266", country: "Lesotho", flag: "🇱🇸" },  
    { code: "+267", country: "Botswana", flag: "🇧🇼" },  
    { code: "+268", country: "Swaziland", flag: "🇸🇿" },  
    { code: "+269", country: "Comoros", flag: "🇰🇲" },  
    { code: "+290", country: "Saint Helena", flag: "🇸🇭" },  
    { code: "+291", country: "Eritrea", flag: "🇪🇷" },  
    { code: "+297", country: "Aruba", flag: "🇦🇼" },  
    { code: "+298", country: "Faroe Islands", flag: "🇫🇴" },  
    { code: "+299", country: "Greenland", flag: "🇬🇱" },  
      
    // Oceania  
    { code: "+61", country: "Australia", flag: "🇦🇺" },  
    { code: "+64", country: "New Zealand", flag: "🇳🇿" },  
    { code: "+679", country: "Fiji", flag: "🇫🇯" },  
    { code: "+685", country: "Samoa", flag: "🇼🇸" },  
    { code: "+676", country: "Tonga", flag: "🇹🇴" },  
    { code: "+678", country: "Vanuatu", flag: "🇻🇺" },  
    { code: "+687", country: "New Caledonia", flag: "🇳🇨" },  
    { code: "+689", country: "French Polynesia", flag: "🇵🇫" },  
    { code: "+690", country: "Tokelau", flag: "🇹🇰" },  
    { code: "+691", country: "Micronesia", flag: "🇫🇲" },  
    { code: "+692", country: "Marshall Islands", flag: "🇲🇭" },  
    { code: "+684", country: "American Samoa", flag: "🇦🇸" },  
    { code: "+680", country: "Palau", flag: "🇵🇼" },  
    { code: "+682", country: "Cook Islands", flag: "🇨🇰" },  
    { code: "+683", country: "Niue", flag: "🇳🇺" },  
    { code: "+675", country: "Papua New Guinea", flag: "🇵🇬" },  
    { code: "+677", country: "Solomon Islands", flag: "🇸🇧" },  
    { code: "+686", country: "Kiribati", flag: "🇰🇮" },  
    { code: "+688", country: "Tuvalu", flag: "🇹🇻" },  
    { code: "+674", country: "Nauru", flag: "🇳🇷" },  
      
    // South America  
    { code: "+55", country: "Brazil", flag: "🇧🇷" },  
    { code: "+54", country: "Argentina", flag: "🇦🇷" },  
    { code: "+56", country: "Chile", flag: "🇨🇱" },  
    { code: "+57", country: "Colombia", flag: "🇨🇴" },  
    { code: "+58", country: "Venezuela", flag: "🇻🇪" },  
    { code: "+51", country: "Peru", flag: "🇵🇪" },  
    { code: "+591", country: "Bolivia", flag: "🇧🇴" },  
    { code: "+593", country: "Ecuador", flag: "🇪🇨" },  
    { code: "+595", country: "Paraguay", flag: "🇵🇾" },  
    { code: "+598", country: "Uruguay", flag: "🇺🇾" },  
    { code: "+597", country: "Suriname", flag: "🇸🇷" },  
    { code: "+592", country: "Guyana", flag: "🇬🇾" },  
    { code: "+594", country: "French Guiana", flag: "🇬🇫" },  
      
    // Central America & Caribbean  
    { code: "+52", country: "Mexico", flag: "🇲🇽" },  
    { code: "+502", country: "Guatemala", flag: "🇬🇹" },  
    { code: "+503", country: "El Salvador", flag: "🇸🇻" },  
    { code: "+504", country: "Honduras", flag: "🇭🇳" },  
    { code: "+505", country: "Nicaragua", flag: "🇳🇮" },  
    { code: "+506", country: "Costa Rica", flag: "🇨🇷" },  
    { code: "+507", country: "Panama", flag: "🇵🇦" },  
    { code: "+1", country: "Jamaica", flag: "🇯🇲" },  
    { code: "+1", country: "Haiti", flag: "🇭🇹" },  
    { code: "+1", country: "Dominican Republic", flag: "🇩🇴" },  
    { code: "+1", country: "Cuba", flag: "🇨🇺" },  
    { code: "+1", country: "Trinidad and Tobago", flag: "🇹🇹" },  
    { code: "+1", country: "Barbados", flag: "🇧🇧" },  
    { code: "+1", country: "Bahamas", flag: "🇧🇸" },  
    { code: "+1", country: "Belize", flag: "🇧🇿" },  
    { code: "+1", country: "Grenada", flag: "🇬🇩" },  
    { code: "+1", country: "Saint Lucia", flag: "🇱🇨" },  
    { code: "+1", country: "Saint Vincent and the Grenadines", flag: "🇻🇨" },  
    { code: "+1", country: "Antigua and Barbuda", flag: "🇦🇬" },  
    { code: "+1", country: "Saint Kitts and Nevis", flag: "🇰🇳" },  
    { code: "+1", country: "Dominica", flag: "🇩🇲" },  
];  

const [isSubmitting, setIsSubmitting] = useState(false);  
const [showPassword, setShowPassword] = useState(false);  
const { t } = useI18n();  
const [errors, setErrors] = useState<{[key: string]: string}>({});  

const { register, isAuthenticated, isLoading, user } = useAuth();  
const router = useRouter();
const pathname = usePathname();

// Removed redundant redirect logic - let AuthGuard handle authentication-based redirects

const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!form.name.trim()) {  
        newErrors.name = t('auth.nameRequired', 'Full name is required');  
    } else if (form.name.trim().length < 2) {  
        newErrors.name = t('auth.nameMinLength', 'Name must be at least 2 characters');  
    } else if (form.name.trim().length > 50) {  
        newErrors.name = t('auth.nameMaxLength', 'Name must be 50 characters or less');  
    }  

    if (!form.username.trim()) {  
        newErrors.username = t('auth.usernameRequired', 'Username is required');  
    } else if (form.username.length < 3) {  
        newErrors.username = t('auth.usernameMinLength', 'Username must be at least 3 characters');  
    } else if (!/^[a-z0-9_]+$/.test(form.username)) {  
        newErrors.username = t('auth.usernameInvalid', 'Username can only contain lowercase letters, numbers, and underscores');  
    }  

    // Validate based on selected contact method
    if (contactMethod === 'email') {
        if (!form.email.trim()) {  
            newErrors.email = t('auth.emailRequired', 'Email is required');  
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {  
            newErrors.email = t('auth.emailInvalid', 'Please enter a valid email address');  
        }
    } else {
        if (!form.phoneNumber.trim()) {  
            newErrors.phoneNumber = t('auth.phoneRequired', 'Phone number is required');  
        } else if (!/^[0-9+\s\-\(\)]+$/.test(form.phoneNumber)) {  
            newErrors.phoneNumber = t('auth.phoneInvalid', 'Please enter a valid phone number');  
        }
    }

    if (!form.password) {  
        newErrors.password = t('auth.passwordRequired', 'Password is required');  
    } else if (form.password.length < 6) {  
        newErrors.password = t('auth.passwordMinLength', 'Password must be at least 6 characters');  
    }  

    setErrors(newErrors);  
    return Object.keys(newErrors).length === 0;  
};  

const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();  
      
    // Clear previous errors  
    setErrors({});  
      
    // Validate form  
    if (!validateForm()) {  
        console.log('Form validation failed');
        return;  
    }  

    setIsSubmitting(true);  

    try {  
        // Prepare form data
        const formData: any = { 
            name: form.name,
            username: form.username,
            password: form.password
        };

        // Add contact method based on selection
        if (contactMethod === 'email') {
            formData.email = form.email.trim().toLowerCase();
            // phoneNumber is optional - don't send it if not provided
        } else {
            const normalizedNumber = form.phoneNumber.replace(/^0+/, "");  
            formData.phoneNumber = selectedCountryCode + normalizedNumber;
            // Email is optional
            if (form.email.trim()) {
                formData.email = form.email.trim().toLowerCase();
            }
        }
          
        console.log('Sign-up: Attempting registration with:', {   
            name: formData.name,   
            username: formData.username,   
            contactMethod,
            phoneNumber: formData.phoneNumber || 'not provided',
            email: formData.email || 'not provided'
        });  
          
        console.log('Before calling register function');
        const result = await register(formData);
        console.log('After register call, result:', result);
        
        if (result.success && result.user) {
            // Clear form on success
            setForm({ name: "", username: "", phoneNumber: "", email: "", password: "" });
            console.log('Sign-up: Registration successful - AuthGuard will handle redirect');
            // Let AuthGuard handle the redirect to SignInSetUp based on authentication state
        } else {
            // Handle registration error
            console.log('Registration failed with message:', result.message);
            setErrors({ general: result.message || t('auth.registrationFailed', 'Registration failed. Please try again.') });
        }
    } catch (err: any) {
        console.error("Sign-up: Registration error:", err);
        
        // Handle specific error cases with better matching  
        const errorMessage = err.message || err.toString() || "";  
        console.log("Sign-up: Error message for handling:", errorMessage);  
        
        if (errorMessage.includes("Username already in use") || errorMessage.includes("username")) {  
            setErrors({ username: t('auth.usernameTaken', 'This username is already taken') });  
        } else if (errorMessage.includes("Phone number already registered") || errorMessage.includes("phone")) {  
            setErrors({ phoneNumber: t('auth.phoneRegistered', 'This phone number is already registered') });  
        } else if (errorMessage.includes("Email already registered") || errorMessage.includes("email")) {  
            setErrors({ email: t('auth.emailRegistered', 'This email is already registered') });  
        } else if (errorMessage.includes("2-50") && errorMessage.includes("chars") && errorMessage.includes("spaces")) {  
            // Handle the specific backend name validation error  
            setErrors({ name: t('auth.nameBackendError', 'Name must be 2-50 characters and can contain letters, spaces, and common punctuation') });  
        } else {  
            // Show the actual error message  
            setErrors({ general: errorMessage || t('auth.registrationFailedGeneric', 'Registration failed. Please try again.') });  
        }
    } finally {  
        setIsSubmitting(false);  
    }  
};
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {  
    setForm({ ...form, [e.target.name]: e.target.value });  
};  


return (  
    <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden">  
        <SpaceBackground />  

        <motion.div  
            initial={{ opacity: 0, y: -50 }}  
            animate={{ opacity: 1, y: 0 }}  
            transition={{ duration: 0.8, ease: "easeOut" }}  
            className="relative z-10 flex flex-col items-center"  
        >  
            <motion.div  
                initial={{ scale: 0 }}  
                animate={{ scale: 1 }}  
                transition={{ type: "spring", stiffness: 120, damping: 12 }}  
            >  
                <Image src="/assets/images/logo.png" alt="Demedia Logo" width={120} height={120} className="mb-6" />  
            </motion.div>  

            <motion.div  
                initial={{ opacity: 0, scale: 0.9 }}  
                animate={{ opacity: 1, scale: 1 }}  
                transition={{ duration: 0.7, delay: 0.3 }}  
                className="relative w-full max-w-md mx-4 sm:mx-6 md:mx-0 rounded-2xl"  
            >  
                <div className="relative bg-gradient-to-br from-[#0d1b2a]/80 via-[#1b263b]/70 to-[#0d1b2a]/80 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border-2 border-transparent animate-shine-border">  
                    <h2 className="text-3xl font-bold text-center text-cyan-200 mb-6">{t('auth.welcomeTitle', 'Create Your Account And Join DeMedia')} 🚀</h2>  

                    <form onSubmit={handleSubmit} className="space-y-4">  
                        {/* Full Name Input */}  
                        <div>  
                            <div className="relative">  
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />  
                                <input   
                                    type="text"   
                                    name="name"   
                                    placeholder={t('auth.name', 'Full Name')}   
                                    value={form.name}   
                                    onChange={handleChange}   
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.name ? 'border border-red-500' : ''}`}   
                                />  
                            </div>  
                            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}  
                            <p className="text-cyan-200/70 text-xs mt-1">  
                                {t('auth.nameHelp', 'Supports all languages including Arabic, Chinese, etc.')}  
                            </p>  
                        </div>  
                          
                        {/* Username Input */}  
                        <div>  
                            <div className="relative">  
                                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />  
                                <input   
                                    type="text"   
                                    name="username"   
                                    placeholder={t('auth.username', 'Username (lowercase only)')}   
                                    value={form.username}   
                                    onChange={(e) => {  
                                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');  
                                        setForm({ ...form, username: value });  
                                    }}  
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.username ? 'border border-red-500' : ''}`}   
                                />  
                            </div>  
                            {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}  
                        </div>  

                        {/* CONTACT METHOD SELECTOR */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-3">
                                {t('auth.contactMethod', 'Choose Sign-Up Method')}
                            </label>
                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setContactMethod('email')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                                        contactMethod === 'email'
                                            ? 'bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white shadow-lg'
                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}
                                >
                                    <Mail size={18} />
                                    {t('auth.email', 'Email')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setContactMethod('phone')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                                        contactMethod === 'phone'
                                            ? 'bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 text-white shadow-lg'
                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}
                                >
                                    <Phone size={18} />
                                    {t('auth.phone', 'Phone')}
                                </button>
                            </div>

                            {/* EMAIL INPUT (shown when email is selected) */}
                            {contactMethod === 'email' && (
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
                                    <input   
                                        type="email"   
                                        name="email"   
                                        placeholder={t('auth.emailPlaceholder', 'your@email.com')}  
                                        value={form.email}   
                                        onChange={handleChange}   
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.email ? 'border border-red-500' : ''}`}   
                                    />  
                                </div>
                            )}

                            {/* PHONE INPUT (shown when phone is selected) */}
                            {contactMethod === 'phone' && (
                                <div className="flex rounded-xl overflow-hidden bg-[#1b263b]/70 border border-gray-600 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20">  
                                    {/* Country Code Dropdown */}  
                                    <div className="relative">  
                                        <select  
                                            value={selectedCountryCode}  
                                            onChange={(e) => setSelectedCountryCode(e.target.value)}  
                                            className="px-4 py-3 bg-transparent text-white border-none focus:outline-none cursor-pointer appearance-none"  
                                        >  
                                            {countryCodes.map((country) => (  
                                                <option key={country.code} value={country.code} className="bg-gray-800 text-white">  
                                                    {country.flag} {country.code}  
                                                </option>  
                                            ))}  
                                        </select>  
                                        {/* Custom dropdown arrow */}  
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">  
                                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">  
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
                                            </svg>  
                                        </div>  
                                    </div>  
                                      
                                    {/* Divider */}  
                                    <div className="w-px bg-gray-600"></div>  
                                      
                                    {/* Phone Number Input */}  
                                    <div className="relative flex-1">  
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />  
                                        <input   
                                            type="tel"   
                                            name="phoneNumber"   
                                            placeholder={t('auth.phonePlaceholder', '1088123981')}  
                                            value={form.phoneNumber}   
                                            onChange={handleChange}   
                                            className={`w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/60 border-none focus:outline-none ${errors.phoneNumber ? 'text-red-400' : ''}`}   
                                        />  
                                    </div>  
                                </div>
                            )}

                            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                            {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
                        </div>  
                          
                        {/* Password Input */}  
                        <div>  
                            <div className="relative">  
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />  
                                <input   
                                    type={showPassword ? "text" : "password"}   
                                    name="password"   
                                    placeholder={t('auth.password', 'Password')}   
                                    value={form.password}   
                                    onChange={handleChange}   
                                    className={`w-full pl-12 pr-12 py-3 rounded-xl bg-[#1b263b]/70 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${errors.password ? 'border border-red-500' : ''}`}   
                                />  
                                <button  
                                    type="button"  
                                    onClick={() => setShowPassword(!showPassword)}  
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"  
                                >  
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}  
                                </button>  
                            </div>  
                            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}  
                        </div>  

                        {errors.general && (  
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">  
                                <p className="text-red-400 text-sm">{errors.general}</p>  
                            </div>  
                        )}  


                        <motion.button   
                            whileHover={{ scale: 1.05 }}   
                            whileTap={{ scale: 0.95 }}   
                            type="submit"   
                            disabled={isSubmitting}  
                            className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"  
                        >  
                            {isSubmitting ? t('auth.creatingAccount', 'Creating Account...') : t('auth.signUp', 'Sign Up')}  
                        </motion.button>  
                    </form>  

                    <p className="text-center text-cyan-100 mt-6 text-sm sm:text-base">  
                        {t('auth.alreadyHaveAccount', 'Already have an account?')} <a href="/sign-in" className="text-cyan-300 hover:underline">{t('auth.login', 'Login')}</a>  
                    </p>  
                </div>  
            </motion.div>  
        </motion.div>  

        <style jsx>{`  
    @keyframes shine-border {
        0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4), inset 0 0 20px rgba(139, 92, 246, 0.2);
            border-color: rgba(139, 92, 246, 0.8);
        }
        25% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.2);
            border-color: rgba(34, 211, 238, 0.8);
        }
        50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.8);
        }
        75% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.2);
            border-color: rgba(168, 85, 247, 0.8);
        }
    }
    .animate-shine-border { animation: shine-border 4s ease-in-out infinite; }  
  `}</style>  

    </div>  
);

}
