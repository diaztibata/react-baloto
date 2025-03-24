import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import "./style.css";

const App = () => {
    const [ultimoNumeroGenerado, setUltimoNumeroGenerado] = useState(null);
    const [yaGuardado, setYaGuardado] = useState(false);
    const [historial, setHistorial] = useState([]);

    const estaEnPeriodoDeSorteo = () => {
        const ahora = new Date();
        const dia = ahora.getUTCDay();
        const hora = ahora.getUTCHours();
        
        if (dia === 4 || dia === 5 || (dia === 6 && hora < 12)) return "SORTEO1";
        if (dia === 0 || dia === 1 || dia === 2 || (dia === 3 && hora < 12)) return "SORTEO2";
        return null;
    };

    const verificarGuardado = async () => {
        const sorteoActual = estaEnPeriodoDeSorteo();
        if (!sorteoActual) return;
        
        const q = query(collection(db, "baloto"), where("sorteo", "==", sorteoActual));
        const snapshot = await getDocs(q);
        setYaGuardado(!snapshot.empty);
    };

    const generarNumeros = () => {
        const numeros = Array.from({ length: 5 }, () => Math.floor(Math.random() * 43) + 1);
        const superBalota = Math.floor(Math.random() * 16) + 1;
        setUltimoNumeroGenerado({ numeros, superBalota });
    };

    const guardarNumeros = async () => {
        if (yaGuardado || !ultimoNumeroGenerado) return;
        
        const sorteoActual = estaEnPeriodoDeSorteo();
        if (!sorteoActual) {
            alert("No es tiempo de guardar números.");
            return;
        }

        await addDoc(collection(db, "baloto"), {
            ...ultimoNumeroGenerado,
            timestamp: serverTimestamp(),
            sorteo: sorteoActual
        });
        setYaGuardado(true);
        cargarHistorial();
    };

    const cargarHistorial = async () => {
        const q = query(collection(db, "baloto"), orderBy("timestamp", "desc"),);
        const snapshot = await getDocs(q);
        setHistorial(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    useEffect(() => {
        verificarGuardado();
        cargarHistorial();
    }, []);

    return (
        <div className="container">
            <h1>Baloto</h1>
            <button onClick={generarNumeros}>Generar Números</button>
            <div id="numeros">
                {ultimoNumeroGenerado && (
                    <>
                        {ultimoNumeroGenerado.numeros.map((num, index) => (
                            <span key={index}>{num}</span>
                        ))}
                        <span className="super">{ultimoNumeroGenerado.superBalota}</span>
                    </>
                )}
            </div>
            <button onClick={guardarNumeros} disabled={yaGuardado}>
                {yaGuardado ? "Ya guardaste en este sorteo" : "Guardar Números"}
            </button>
            <h2>Historial</h2>
            <ul id="historial">
                {historial.map((item) => (
                    <li key={item.id}>
                        <p>{new Date(item.timestamp?.toDate()).toLocaleDateString("es-ES")}</p>
                        <p>
                            {item.numeros.map((num, idx) => (
                                <span key={idx}>{num}</span>
                            ))}
                            <span className="super">{item.superBalota}</span>
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default App;