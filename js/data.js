// ==========================================
// EDIT YOUR CONTENT HERE
// Just change the text inside the quotes ("")
// ==========================================

const siteData = {
    // Your basic info used across the site
    profile: {
        name: "Reza Nazariye",
        title: "M.Sc. Student in Electrical Engineering (Digital Electronics)",
        email: "reza.nazariye86@sharif.edu",
        github: "https://github.com/RezaNazariye",
        linkedin: "https://www.linkedin.com/in/YOUR_LINKEDIN"
    },

    // Your Projects (Add or remove items from this list)
    projects: [
        {
            title: "Custom FPGA Architecture & Bitstream Programming",
            description: "Designed a custom FPGA from scratch in Verilog (CLBs, LUT4s, routing matrix). Performed manual synthesis and place-and-route to generate a 38-bit configuration bitstream.",
            link: "https://github.com/RezaNazariye/VLSI_course_custom-fpga-architecture",
            tags: ["Verilog", "SystemVerilog", "Vivado", "Architecture"]
        },
        {
            title: "Single-Cycle MIPS Processor (ACA-MIPS)",
            description: "Implemented the complete datapath and control unit for a 32-bit MIPS processor. Extended the baseline to support zero-extension, LUI, BNE, and Jump instructions.",
            link: "https://github.com/RezaNazariye/AdvancedComputerArchitecture_Single-Cycle_MIPS_Processor",
            tags: ["Verilog", "ModelSim", "Datapath", "ISA"]
        },
        {
            title: "Hardware-Accelerated Edge Detection",
            description: "Engineered a real-time image-processing system on a Xilinx Zynq-7000 SoC. Implemented the Sobel algorithm in hardware (PL) and bare-metal C on the PS.",
            link: "#",
            tags: ["Zynq-7000", "AXI", "Bare-metal C", "Image Processing"]
        }
    ],

    // Your Research/Experience
    experience: [
        {
            role: "Undergraduate Researcher",
            organization: "Power Electronics Lab, Sharif University of Technology",
            period: "Oct 2025 – Aug 2026",
            details: [
                "Designed and built a real-time digital monitoring system for pulsed power supplies using digital signal processing.",
                "Designed the system to identify failed parallel switches and request replacement before they reach a critical limit."
            ]
        },
        {
            role: "Board Design and Development",
            organization: "Tavan Tadbir Fanavar Co., Shiraz, Iran",
            period: "Summer 2025",
            details: [
                "Designed a fully isolated interface board for communication in high-noise industrial environments."
            ]
        }
    ],
    interests: [
        "Digital VLSI Design",
        "Computer Architecture",
        "FPGA-Based Computing",
        "Hardware/Software Co-Design",
        "Digital Verification"
    ],

    awards: [
        {
            title: "6th Place",
            description: "Iranian M.Sc. Entrance Exam",
            year: "2026"
        },
        {
            title: "8th Place",
            description: "31st Iranian National Student Olympiad",
            year: "2024"
        },
        {
            title: "100th Place",
            description: "National University Entrance Exam",
            year: "2022"
        }
    ],
};