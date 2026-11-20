from setuptools import setup, find_packages

setup(
    name="aave-local-companion",
    version="1.0.0",
    description="AAVE Local Companion Service",
    author="Randi Sumitro",
    author_email="136390141+randisumitro@users.noreply.github.com",
    url="https://github.com/randisumitro/aave",
    license="MIT",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn>=0.24.0",
        "pydantic>=2.5.0",
        "websockets>=12.0",
        "httpx>=0.25.0",
    ],
    entry_points={
        "console_scripts": [
            "aave-companion=main:app",
        ],
    },
    python_requires=">=3.11",
)
