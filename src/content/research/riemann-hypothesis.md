---
title: Riemann Zeta Function & Spectral Graph Theory
collection: research
category: Mathematics
tags: [math, riemann, zeta, spectral-graph, number-theory]
date: 2026-07-10
author: Prof. Julian Thorne
summary: Exploring connections between non-trivial zeros of the Riemann Zeta function and eigenvalue distributions of random graph Laplacians.
---

# Riemann Zeta Function & Spectral Graph Theory

The analytical continuation of the Riemann Zeta function $\zeta(s)$ plays a fundamental role in number theory and prime distribution:

$$
\zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} = \prod_{p \text{ prime}} \frac{1}{1 - p^{-s}}, \quad \text{Re}(s) > 1
$$

:::quote
**Montgomery's Pair Correlation Conjecture**
The normalized spacing between non-trivial zeros $s_n = \frac{1}{2} + i \gamma_n$ mirrors the Gaussian Unitary Ensemble (GUE) eigenvalue spacing of large Hermitian random matrices.
:::

## Spectral Graph Laplacian Connection

For a $k$-regular Ramanujan graph $G = (V, E)$, its adjacency matrix eigenvalues $\lambda_i$ satisfy the Alon-Boppana bound:

$$
|\lambda_i| \le 2 \sqrt{k - 1}, \quad \forall \lambda_i \neq k
$$

We formulate the graph Ihara Zeta function:

$$
Z_G(u) = \prod_{[p]} \frac{1}{1 - u^{|p|}} = \frac{1}{\det(I - A u + (k - 1) u^2 I)}
$$

---

## Interactive Zeta Eigenvalue Distribution

```chart
{
  "type": "area",
  "title": "Normalized Zero Spacing Density P(s)",
  "data": [
    { "spacing": "0.0", "GUE": 0.00, "Poisson": 1.00 },
    { "spacing": "0.5", "GUE": 0.45, "Poisson": 0.61 },
    { "spacing": "1.0", "GUE": 1.05, "Poisson": 0.37 },
    { "spacing": "1.5", "GUE": 0.85, "Poisson": 0.22 },
    { "spacing": "2.0", "GUE": 0.38, "Poisson": 0.14 },
    { "spacing": "2.5", "GUE": 0.12, "Poisson": 0.08 }
  ],
  "xKey": "spacing",
  "series": [
    { "key": "GUE", "name": "GUE / Zeta Zeros", "color": "#6366f1" },
    { "key": "Poisson", "name": "Random Uncorrelated", "color": "#94a3b8" }
  ]
}
```

## Connected Topics
- Learn how graph eigenvalues apply to [[2026-08-01-quantum-computing|Quantum Graph Computing]].
- Return to [[getting-started|Getting Started Guide]].
