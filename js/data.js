const siteData = {
    profile: {
        name: "Reza Nazariye",
        title: "M.Sc. Student in Electrical Engineering (Digital Electronics)",
        email: "reza.nazariye86@sharif.edu",
        phone: "+98 917 734 9447",
        location: "Tehran, Iran",
        github: "https://github.com/RezaNazariye",
        linkedin: "https://www.linkedin.com/in/YOUR_LINKEDIN",
        bio: "I am a hardware engineer specializing in Digital VLSI, Computer Architecture, and FPGA design. I am passionate about building efficient systems from the ground up and rigorously verifying them against golden models."
    },

    highlights: [
        { title: "Ranked 6th", desc: "Iranian National M.Sc. Entrance Exam in EE (2026)" },
        { title: "Ranked 8th", desc: "31st Iranian National Student Olympiad in EE" },
        { title: "Ranked 100th", desc: "Iranian National University Entrance Exam (Math & Physics)" },
        { title: "GPA 17.09/20", desc: "B.Sc. in Electrical Engineering, Sharif University" }
    ],

    research: {
        interests: [
            "Digital VLSI System Design",
            "Computer Architecture & Processor Design",
            "Hardware Verification (UVM)",
            "FPGA Prototyping & Hardware/Software Co-design"
        ],
        experience: [
            {
                role: "Undergraduate Researcher",
                org: "Power Electronics Laboratory, Sharif University of Technology",
                period: "Oct 2025 – Aug 2026",
                supervisor: "Dr. Mostafa Zarghani",
                details: [
                    "Designed and built a real-time digital monitoring system for pulsed power supplies using digital signal processing.",
                    "Designed the system to identify the number of failed parallel switches and request replacement before they reached a critical limit."
                ]
            }
        ]
    },

    projects: [
        {
            title: "Custom FPGA Architecture & Bitstream Programming",
            desc: "Designed a custom FPGA architecture from scratch in Verilog (CLBs, LUT4s, routing matrix). Performed manual synthesis and place-and-route, generating a 38-bit configuration bitstream to map logic onto the FPGA fabric.",
            tags: ["Verilog", "SystemVerilog", "Vivado", "Architecture"],
            link: "https://github.com/RezaNazariye/VLSI_course_custom-fpga-architecture"
        },
        {
            title: "Single-Cycle MIPS Processor (ACA-MIPS)",
            desc: "Implemented the complete datapath and combinational control unit for a 32-bit Single-Cycle MIPS processor. Extended the baseline architecture to support zero-extension, LUI, BNE, and Jump instructions.",
            tags: ["Verilog", "ModelSim", "Datapath", "ISA"],
            link: "https://github.com/RezaNazariye/AdvancedComputerArchitecture_Single-Cycle_MIPS_Processor"
        },
        {
            title: "Hardware-Accelerated Edge Detection on Zynq SoC",
            desc: "Engineered a real-time image-processing system on a Xilinx Zynq-7000 SoC. Implemented the Sobel edge-detection algorithm in hardware (PL) and a bare-metal C application on the PS to manage data flow.",
            tags: ["Zynq-7000", "AXI", "Bare-metal C", "Image Processing"],
            link: "#"
        },
        {
            title: "PS-PL Accelerated Waveform Generator on Zynq SoC",
            desc: "Engineered a hardware/software co-design with a custom PL IP for waveform acceleration, controlled by a bare-metal PS application via an interrupt-driven BRAM interface. Debugged AXI transactions using Vivado ILA.",
            tags: ["Zynq-7000", "BRAM", "Interrupts", "Vivado ILA"],
            link: "#"
        },
        {
            title: "UVM Verification of an RTC Clock-Generation Circuit",
            desc: "Built a Universal Verification Methodology (UVM) testbench to verify a submodule of a Real-Time Clock (RTC) clock-generation circuit, implementing agents, drivers, monitors, and scoreboards.",
            tags: ["SystemVerilog", "UVM", "Verification"],
            link: "#"
        },
        {
            title: "Embedded Security System on Orange Pi",
            desc: "Engineered a complete embedded security system on Linux using multi-threaded Python with OpenCV for real-time face detection. Designed a full-stack web control panel for live video streaming and RESTful API configuration.",
            tags: ["Linux", "Python", "OpenCV", "MySQL", "REST API"],
            link: "#"
        }
    ],

    publications: [
        {
            title: "Real-time Digital Monitoring System for Pulsed Power Supplies",
            authors: "Reza Nazariye, et al.",
            venue: "Undergraduate Research Project / Technical Report",
            year: "2026",
            link: "#"
        },
        {
            title: "Manual Synthesis and Bitstream Generation for Custom FPGA Architectures",
            authors: "Reza Nazariye",
            venue: "Digital VLSI System Design Course Project, Sharif University",
            year: "2026",
            link: "https://github.com/RezaNazariye/VLSI_course_custom-fpga-architecture"
        }
    ],

    teaching: [
        {
            role: "Teaching Assistant — ASIC/FPGA Problem-Solving",
            org: "Sharif University of Technology",
            period: "Jul 2026 – Aug 2026",
            details: [
                "Held regular problem-solving sessions.",
                "Guided and mentored five different groups through the completion of a full implementation project."
            ]
        },
        {
            role: "Lab Assistant — Computer Architecture",
            org: "Sharif University of Technology",
            period: "Jul 2025 – Aug 2025",
            details: [
                "Provided weekly guidance to students on MIPS architecture and Verilog implementation in Dr. Movahedin's laboratory."
            ]
        },
        {
            role: "Teaching Assistant — Theory of Electrical Circuits",
            org: "Sharif University of Technology",
            period: "Feb 2024 – Jun 2024",
            details: [
                "Held weekly problem-solving sessions for Dr. Zarghani's circuit theory course."
            ]
        }
    ],

    skills: {
        hardware: ["FPGA (Zynq)", "PCB Design (Altium Designer)", "MIPS Architecture", "STM32", "ESP32", "Proteus", "Altera"],
        languages: ["Verilog / SystemVerilog", "C / C++", "Python", "MATLAB", "MIPS Assembly", "x86 Assembly", "Java", "C#", "JavaScript", "HTML/CSS"],
        tools: ["Xilinx Vivado", "ModelSim", "SPICE", "Linux", "LaTeX", "Git", "UVM"]
    }
};